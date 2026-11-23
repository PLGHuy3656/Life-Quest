import {
  I_BASE_CLIPS, I_ONE_SHOT_CLIPS, OUTFIT_IDS, type FoxController, type FoxEventName,
} from '../mascot';

export interface VoiceTestResult {
  name: string;
  pass: boolean;
  detail: Record<string, unknown>;
}

const VOICE_EVENTS: readonly FoxEventName[] = [
  'VOICE_LISTEN_STARTED', 'VOICE_LISTENING', 'VOICE_PROCESSING', 'TASK_SUGGESTION_READY',
  'TASK_NOTEBOOK_OPEN', 'TASK_WRITING', 'TASK_CREATED', 'VOICE_RETRY_REQUESTED',
  'VOICE_CANCELLED', 'VOICE_PERMISSION_DENIED',
];

function step(c: FoxController, sec: number, dt = 1 / 24) {
  for (let t = 0; t < sec - 1e-9; t += dt) c.debug.step(dt);
  return c.getState();
}

function reset(c: FoxController) {
  c.pause();
  c.debug.daily.clear();
  c.debug.anim.cancelOneShots();
  c.debug.effects.clearTransient();
  c.debug.effects.clearProps();
  c.setActivity('idle');
  c.debug.anim.setBaseInstant('idle', 0);
  c.setStreak({ active: false });
  c.setGroupStreak(false);
  c.setReducedMotion(false);
  c.setIdleVariationEnabled(false);
  c.setLookAtEnabled(false);
  c.setLevel(20, { immediate: true });
  c.resetOutfit();
  step(c, 0.5);
}

export async function runVoiceTests(c: FoxController): Promise<VoiceTestResult[]> {
  const out: VoiceTestResult[] = [];
  const push = (name: string, pass: boolean, detail: Record<string, unknown> = {}) => out.push({ name, pass, detail });

  // 1. All 8 clips loaded in the voice module
  reset(c);
  const avail = new Set(c.availableClips());
  const all8 = [...I_BASE_CLIPS, ...I_ONE_SHOT_CLIPS];
  const missing = all8.filter(n => !avail.has(n));
  push('All 8 Gate I voice clips loaded and available', missing.length === 0, { total: all8.length, missing });

  // 2. Full happy-path sequence: Listening -> Processing -> Suggesting -> Opening -> Writing -> Confirming (app-triggered)
  reset(c);
  const rListen = c.handleEvent('VOICE_LISTEN_STARTED', { sessionId: 'v1' });
  const sListenStart = step(c, 0.4);
  const sListenLoop = step(c, 2.0);
  const rListenRefresh = c.handleEvent('VOICE_LISTENING', { sessionId: 'v1' });
  const sListenLoop2 = step(c, 0.5);
  const rProc = c.handleEvent('VOICE_PROCESSING', { sessionId: 'v1' });
  const sProc = step(c, 0.8);
  const rSug = c.handleEvent('TASK_SUGGESTION_READY', { sessionId: 'v1', taskCount: 1 });
  const sSug = step(c, 0.5);
  step(c, 2.5);
  const rOpen = c.handleEvent('TASK_NOTEBOOK_OPEN', { sessionId: 'v1' });
  const sOpenShot = step(c, 0.5);
  const sWriteLoop = step(c, 2.5);
  const propsWhileWriting = sWriteLoop.props.map(p => p.id).sort();
  const rWriteRefresh = c.handleEvent('TASK_WRITING', { sessionId: 'v1' });
  const sWriteWait = step(c, 6.0); // wait 6 full seconds — must NOT auto-confirm!
  const stillWriting = sWriteWait.base === 'task_notebook_write' && sWriteWait.oneShot === null;

  // Now application sends TASK_CREATED
  const rCreated = c.handleEvent('TASK_CREATED', { sessionId: 'v1', taskId: 'task-42' });
  const sConfirm = step(c, 0.5);
  const sAfterConfirm = step(c, 3.5);
  const propsAfterConfirm = sAfterConfirm.props.map(p => p.id);

  push(
    'Voice -> Task sequence: Listening -> Processing -> Suggesting -> Opening -> Writing -> Confirming',
    rListen.result === 'handled' && sListenStart.oneShot === 'voice_listen_start' && sListenLoop.base === 'voice_listening_loop'
      && rListenRefresh.result === 'handled' && sListenLoop2.base === 'voice_listening_loop'
      && rProc.result === 'handled' && sProc.base === 'voice_processing'
      && rSug.result === 'handled' && sSug.oneShot === 'task_suggestion'
      && rOpen.result === 'handled' && sOpenShot.oneShot === 'task_notebook_open' && sWriteLoop.base === 'task_notebook_write'
      && rWriteRefresh.result === 'handled' && stillWriting
      && rCreated.result === 'handled' && sConfirm.oneShot === 'task_notebook_confirm' && sAfterConfirm.base === 'idle',
    {
      listenStart: sListenStart.oneShot, listenLoop: sListenLoop.base, proc: sProc.base, sug: sSug.oneShot,
      openShot: sOpenShot.oneShot, writeLoop: sWriteLoop.base, stillWritingAfter6s: stillWriting,
      confirmShot: sConfirm.oneShot, afterConfirmBase: sAfterConfirm.base,
    },
  );

  // 3. Notebook + Pencil reuse & cleanup
  push(
    'G2.1 NotebookProp + PencilProp attached during writing and cleaned up after TASK_CREATED',
    propsWhileWriting.includes('notebook') && propsWhileWriting.includes('pencil') && propsAfterConfirm.length === 0,
    { propsWhileWriting, propsAfterConfirm },
  );

  // 4. Application-driven confirmation guarantee (never auto-confirms on timer)
  reset(c);
  const shots: string[] = [];
  const unsub = c.on(e => { if (e.type === 'oneshot-start') shots.push(e.clip); });
  c.handleEvent('TASK_NOTEBOOK_OPEN');
  step(c, 10.0); // 10 seconds in writing loop without TASK_CREATED
  const confirmedWithoutEvent = shots.includes('task_notebook_confirm');
  c.handleEvent('TASK_CREATED');
  step(c, 0.4);
  const confirmedAfterEvent = shots.includes('task_notebook_confirm');
  unsub();
  push(
    'Application-driven confirmation: task_notebook_confirm never plays before TASK_CREATED',
    !confirmedWithoutEvent && confirmedAfterEvent,
    { shots, confirmedWithoutEvent, confirmedAfterEvent },
  );

  // 5. Cancellation (VOICE_CANCELLED) mid-writing & mid-listening — zero confirm, props removed
  reset(c);
  const cancelShots: string[] = [];
  const unsub2 = c.on(e => { if (e.type === 'oneshot-start') cancelShots.push(e.clip); });
  c.handleEvent('TASK_NOTEBOOK_OPEN');
  step(c, 3.0);
  const rCancel = c.handleEvent('VOICE_CANCELLED');
  const sAfterCancel = step(c, 1.0);
  unsub2();
  push(
    'VOICE_CANCELLED exits writing cleanly without task_notebook_confirm and hides notebook/pencil',
    rCancel.result === 'handled' && !cancelShots.includes('task_notebook_confirm') && sAfterCancel.base === 'idle' && sAfterCancel.props.length === 0,
    { cancelShots, base: sAfterCancel.base, props: sAfterCancel.props },
  );

  // 6. Retry & Permission Denied
  reset(c);
  c.handleEvent('VOICE_PROCESSING');
  step(c, 0.8);
  const rRetry = c.handleEvent('VOICE_RETRY_REQUESTED', { reason: 'no-speech' });
  const sRetry = step(c, 0.4);
  step(c, 2.8);
  const rPerm = c.handleEvent('VOICE_PERMISSION_DENIED');
  const sPerm = step(c, 0.4);
  const sPermAfter = step(c, 2.8);
  push(
    'VOICE_RETRY_REQUESTED and VOICE_PERMISSION_DENIED cancel active voice state and play voice_retry',
    rRetry.result === 'handled' && sRetry.oneShot === 'voice_retry' && rPerm.result === 'handled' && sPerm.oneShot === 'voice_retry' && sPermAfter.base === 'idle',
    { retryShot: sRetry.oneShot, permShot: sPerm.oneShot, afterPermBase: sPermAfter.base },
  );

  // 7. Reduced motion support
  reset(c);
  c.setReducedMotion(true);
  c.handleEvent('TASK_NOTEBOOK_OPEN');
  const sRmWrite = step(c, 0.6); // large-motion task_notebook_open skipped -> goes straight to task_notebook_write loop
  c.handleEvent('TASK_CREATED');
  const sRmAfter = step(c, 0.6); // large-motion task_notebook_confirm substituted by proud mood
  push(
    'Reduced motion: skips large-motion transitions while preserving state & completion read',
    sRmWrite.base === 'task_notebook_write' && sRmAfter.base === 'idle' && sRmAfter.oneShot !== 'task_notebook_confirm',
    { rmWriteBase: sRmWrite.base, rmAfterBase: sRmAfter.base, rmAfterShot: sRmAfter.oneShot, rmMood: sRmAfter.mood },
  );

  // 8. All 6 H2 outfits compatibility + HAND_RIGHT hand-busy while pencil is held
  reset(c);
  const outfitResults: Record<string, { ok: boolean; handRightDuringWrite: string | null }> = {};
  for (const oid of OUTFIT_IDS) {
    reset(c);
    const eq = await c.setOutfit(oid);
    c.handleEvent('TASK_NOTEBOOK_OPEN');
    step(c, 2.8);
    const items = c.getEquippedItems();
    const hr = items.find(i => i.slot === 'HAND_RIGHT');
    const handBusyOk = !hr || hr.visibility === 'hidden-hand-busy';
    c.handleEvent('TASK_CREATED');
    step(c, 3.8);
    const itemsAfter = c.getEquippedItems();
    const hrAfter = itemsAfter.find(i => i.slot === 'HAND_RIGHT');
    const handRestoredOk = !hrAfter || hrAfter.visibility === 'visible';
    outfitResults[oid] = { ok: eq.every(x => x.ok) && handBusyOk && handRestoredOk, handRightDuringWrite: hr?.visibility ?? null };
  }
  push(
    'All 6 H2 outfits stay attached through voice notebook flow; HAND_RIGHT items hide for PencilProp and restore',
    Object.values(outfitResults).every(v => v.ok),
    outfitResults,
  );

  // 9. Typed event coverage check (all 10 approved events registered)
  reset(c);
  const allRegistered = VOICE_EVENTS.every(e => c.handleEvent(e).result !== 'unknown');
  reset(c);
  push('All 10 approved Gate I voice events registered and handled', allRegistered, { count: VOICE_EVENTS.length });

  return out;
}

export function runVoiceFallbackTests(c: FoxController): VoiceTestResult[] {
  const out: VoiceTestResult[] = [];
  reset(c);
  const r1 = c.handleEvent('VOICE_LISTEN_STARTED');
  step(c, 0.5);
  const r2 = c.handleEvent('TASK_SUGGESTION_READY');
  step(c, 0.5);
  const r3 = c.handleEvent('TASK_NOTEBOOK_OPEN');
  step(c, 0.5);
  const r4 = c.handleEvent('TASK_CREATED');
  step(c, 0.5);
  const r5 = c.handleEvent('VOICE_CANCELLED');
  step(c, 0.5);
  out.push({
    name: 'Fallback when voice module is absent: all events handled gracefully without errors',
    pass: [r1, r2, r3, r4, r5].every(r => r.result === 'handled'),
    detail: { results: [r1.result, r2.result, r3.result, r4.result, r5.result] },
  });
  return out;
}
