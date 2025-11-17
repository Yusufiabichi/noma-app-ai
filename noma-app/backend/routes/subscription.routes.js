import { Router } from 'express';

const subscriptionRouter = Router();

subscriptionRouter.get('/', (req, res) => res.send({title: 'Get all subscriptions'}))

subscriptionRouter.get('/:id', (req, res) => res.send({title: 'Get subscription details'}))

subscriptionRouter.post('/', (req, res) => res.send({title: 'Create subscription'}))

subscriptionRouter.put('/', (req, res) => res.send({title: 'Update subscription'}))

subscriptionRouter.delete('/', (req, res) => res.send({title: 'Delete subscription'}))

subscriptionRouter.get('/user/:id', (req, res) => res.send({title: 'Get all user subscriptions'}))

subscriptionRouter.put('/:id/cancel', (req, res) => res.send({title: 'Cancel subscription'}))

subscriptionRouter.get('/upcoming-renewals', (req, res) => res.send({title: 'Get upcoming renewals'}))





export default subscriptionRouter;