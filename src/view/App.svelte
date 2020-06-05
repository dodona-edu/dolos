<script>
	const promise = fetch("/data/info.json").then(async response => {
		const data = await response.json();
		return data["count"];
	});
</script>

<main>
	{#await promise }
	<h1>Loading...</h1>
	{:then count }
	<h1>Dolos found { count } results.</h1>
	{/await}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>