import { AppContext } from '@/index';
import * as handlers from '@/api/users/handlers';
import { apiSuccessResponse } from '@/lib/response';

export async function onDeleteUser(c: AppContext) {
	const id = c.req.param('id');
	await handlers.deleteUser(c);
	return c.json(
		apiSuccessResponse({
			id,
			status: 'deleted',
		}),
	);
}

export async function onGetUser(c: AppContext) {
	const user = await handlers.getUserById(c);
	return c.json(apiSuccessResponse(user));
}

export async function onSetSchnlTag(c: AppContext) {
	const user = await handlers.setSchnlTag(c);
	return c.json(apiSuccessResponse(user));
}

export async function onUpdatePrivacy(c: AppContext) {
	const user = await handlers.updatePrivacySettings(c);
	return c.json(apiSuccessResponse(user));
}

export async function onUpdateProfilePicture(c: AppContext) {
	const response = await handlers.updateProfilePicture(c);
	return c.json(apiSuccessResponse(response));
}

export async function onKycLegalName(c: AppContext) {
	const user = await handlers.kycLegalName(c);
	return c.json(apiSuccessResponse(user));
}

export async function onSearchUsers(c: AppContext) {
	const response = await handlers.searchUsers(c);
	return c.json(apiSuccessResponse(response));
}
