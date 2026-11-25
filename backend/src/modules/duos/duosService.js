import { duosRepository } from './duosRepository.js'
import { friendsRepository } from '../friends/friendsRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy danh sách Duo của User
const getDuos = async (userId, query) => {
  return await duosRepository.findUserDuos(userId, query)
}

// Tạo Duo mới và mời đối tác
const createDuo = async (userId, { partnerId, ruleId }) => {
  if (userId === partnerId) {
    throw new ApiError(400, 'Cannot create a duo with yourself', 'SELF_DUO_NOT_ALLOWED')
  }

  // Kiểm tra mối quan hệ bạn bè (phải là bạn bè mới có thể tạo Duo)
  const friendship = await friendsRepository.findRelationshipBetween(userId, partnerId)
  if (!friendship || friendship.status !== 'ACCEPTED') {
    throw new ApiError(403, 'You can only create a duo with an accepted friend', 'NOT_FRIENDS')
  }

  return await duosRepository.createDuoWithMembers(userId, partnerId, ruleId)
}

// Chi tiết Duo theo ID
const getDuoById = async (userId, duoId) => {
  const duo = await duosRepository.findDuoById(duoId)
  if (!duo) {
    throw new ApiError(404, 'Duo not found', 'DUO_NOT_FOUND')
  }

  const isMember = duo.members.some((m) => m.userId === userId)
  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this duo', 'NOT_DUO_MEMBER')
  }

  return duo
}

// Gửi lại lời mời cho đối tác
const invitePartner = async (userId, duoId, partnerId) => {
  const duo = await duosRepository.findDuoById(duoId)
  if (!duo) {
    throw new ApiError(404, 'Duo not found', 'DUO_NOT_FOUND')
  }

  if (duo.createdBy !== userId) {
    throw new ApiError(403, 'Only the duo creator can invite partners', 'FORBIDDEN')
  }

  return await duosRepository.addDuoMember(duoId, partnerId, 'INVITED')
}

// Chấp nhận lời mời tham gia Duo
const acceptDuoInvitation = async (userId, duoId, memberId) => {
  const member = await duosRepository.findDuoMemberById(memberId)
  if (!member || member.duoId !== duoId || member.userId !== userId) {
    throw new ApiError(404, 'Invitation not found', 'INVITATION_NOT_FOUND')
  }

  if (member.status !== 'INVITED') {
    throw new ApiError(400, 'Invitation is not in pending state', 'INVALID_INVITATION_STATUS')
  }

  await duosRepository.updateDuoMemberStatus(memberId, 'ACCEPTED')

  // Khi đối tác đã chấp nhận -> kích hoạt Duo chuyển sang ACTIVE
  await duosRepository.updateDuoStatus(duoId, 'ACTIVE')

  return await duosRepository.findDuoById(duoId)
}

// Từ chối lời mời tham gia Duo
const rejectDuoInvitation = async (userId, duoId, memberId) => {
  const member = await duosRepository.findDuoMemberById(memberId)
  if (!member || member.duoId !== duoId || member.userId !== userId) {
    throw new ApiError(404, 'Invitation not found', 'INVITATION_NOT_FOUND')
  }

  if (member.status !== 'INVITED') {
    throw new ApiError(400, 'Invitation is not in pending state', 'INVALID_INVITATION_STATUS')
  }

  await duosRepository.updateDuoMemberStatus(memberId, 'DECLINED')
  await duosRepository.updateDuoStatus(duoId, 'DISBANDED')

  return { success: true, message: 'Duo invitation declined' }
}

// Rời khỏi Duo
const leaveDuo = async (userId, duoId) => {
  const duo = await duosRepository.findDuoById(duoId)
  if (!duo) {
    throw new ApiError(404, 'Duo not found', 'DUO_NOT_FOUND')
  }

  const member = duo.members.find((m) => m.userId === userId)
  if (!member) {
    throw new ApiError(403, 'You are not a member of this duo', 'NOT_DUO_MEMBER')
  }

  await duosRepository.updateDuoMemberStatus(member.id, 'LEFT')
  await duosRepository.updateDuoStatus(duoId, 'DISBANDED')

  return { success: true, message: 'You have left the duo' }
}

export const duosService = {
  getDuos,
  createDuo,
  getDuoById,
  invitePartner,
  acceptDuoInvitation,
  rejectDuoInvitation,
  leaveDuo
}
