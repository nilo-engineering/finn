import { fail, type Actions } from '@sveltejs/kit';
import { parseMoney } from '$lib/utils/money';
import { movementType } from '$lib/modules/movements/movements';

const REPEATS = ['none', 'monthly', 'weekly', 'daily', 'installments'];

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const rawValue = String(data.get('value') ?? '');
		const type = String(data.get('type') ?? '');
		const description = String(data.get('description') ?? '');
		const date = String(data.get('date') ?? '');
		const repeat = String(data.get('repeat') ?? '');

		// Echo the input back so the form can repopulate on a failed submit.
		const values = { value: rawValue, type, description, date, repeat };

		const value = parseMoney(rawValue);
		if (!Number.isFinite(value) || value <= 0) {
			return fail(400, { message: 'Enter a value greater than zero.', values });
		}
		if (!movementType(type)) {
			return fail(400, { message: 'Choose a movement type.', values });
		}
		if (!date || Number.isNaN(Date.parse(date))) {
			return fail(400, { message: 'Choose a valid date.', values });
		}
		if (!REPEATS.includes(repeat)) {
			return fail(400, { message: 'Choose a repeat option.', values });
		}

		// TODO: persist movement once the transaction/query layer lands. For now the
		// action only validates and reports success (semantic 201 CREATED).
		return { success: true };
	}
};
