import { Router, type NextFunction, type Request, type Response } from "express";
import authenticate from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { issueController } from "../issue/issue.controller";

const router = Router()

router.get('/', issueController.getAllIssues);
router.get('/:id', issueController.getIssueById);


router.post('/', authenticate(), issueController.createIssue);
router.patch('/:id', authenticate(), issueController.updateIssueById);
router.delete('/:id', authenticate(), authorize('maintainer'), issueController.deleteIssueById);

// router.get('/:id', issueController.getIssueById);
// router.put('/:id', issueController.updateIssueById);
// router.delete('/:id', issueController.deleteIssueById)

export const issueRoute = router;