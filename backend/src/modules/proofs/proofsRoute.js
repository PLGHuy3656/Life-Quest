import express from 'express'
import { proofsController } from './proofsController.js'
import { proofsValidation } from './proofsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

// Router cho /executions/:executionId/proofs
const executionProofsRouter = express.Router()

executionProofsRouter.route('/:executionId/proofs')
  .get(authenticate, validate(proofsValidation.getProofsByExecutionId), proofsController.getProofsByExecutionId)
  .post(authenticate, validate(proofsValidation.createProof), proofsController.createProof)

// Router cho /proofs/:proofId
const proofsRouter = express.Router()

proofsRouter.route('/:proofId')
  .delete(authenticate, validate(proofsValidation.deleteProof), proofsController.deleteProof)

proofsRouter.post('/:proofId/share', authenticate, validate(proofsValidation.shareProof), proofsController.shareProof)

export const executionProofsRoute = executionProofsRouter
export const proofsRoute = proofsRouter
