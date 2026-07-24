<script lang="ts">
	import { page } from '$app/state';

	const type = $derived(page.url.searchParams.get('type'));
</script>

<h1>add {type}</h1>
