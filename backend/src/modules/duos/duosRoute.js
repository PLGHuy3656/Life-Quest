import express from 'express'
import { duosController } from './duosController.js'
import { duosValidation } from './duosValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /api/v1/duos
Router.route('/')
  .get(authenticate, validate(duosValidation.getDuos), duosController.getDuos)
  .post(authenticate, validate(duosValidation.createDuo), duosController.createDuo)

// /api/v1/duos/:duoId
Router.route('/:duoId')
  .get(authenticate, validate(duosValidation.duoIdParam), duosController.getDuoById)

// /api/v1/duos/:duoId/invitations
Router.post('/:duoId/invitations', authenticate, validate(duosValidation.invitePartner), duosController.invitePartner)

// /api/v1/duos/:duoId/invitations/:memberId/accept
Router.post('/:duoId/invitations/:memberId/accept', authenticate, validate(duosValidation.duoMemberParam), duosController.acceptDuoInvitation)

// /api/v1/duos/:duoId/invitations/:memberId/reject
Router.post('/:duoId/invitations/:memberId/reject', authenticate, validate(duosValidation.duoMemberParam), duosController.rejectDuoInvitation)

// /api/v1/duos/:duoId/leave
Router.post('/:duoId/leave', authenticate, validate(duosValidation.duoIdParam), duosController.leaveDuo)

export const duosRoute = Router
