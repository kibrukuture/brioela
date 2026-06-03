import { Hono } from 'hono';
import * as controller from '@/api/users/user.controller';
import { API_ROUTE_PATTERNS } from '@schnl/shared/api';

export const userRouter = new Hono();

userRouter.get(API_ROUTE_PATTERNS.users.search, controller.onSearchUsers);

userRouter.get(API_ROUTE_PATTERNS.users.getById, controller.onGetUser);

userRouter.delete(API_ROUTE_PATTERNS.users.delete, controller.onDeleteUser);

userRouter.post(API_ROUTE_PATTERNS.users.schnlTag, controller.onSetSchnlTag);

userRouter.patch(API_ROUTE_PATTERNS.users.updatePrivacy, controller.onUpdatePrivacy);

userRouter.patch(API_ROUTE_PATTERNS.users.profilePicture, controller.onUpdateProfilePicture);

userRouter.post(API_ROUTE_PATTERNS.users.kycLegalNameAndWallet, controller.onKycLegalName);
