<script>
	const infoReq = fetch("/data/analysis.json").then(async response => {
		return await response.json();
	});
	const intersectionsReq = fetch("/data/intersections.csv").then(async response => {
		return await response.body.getReader().read();
	});
	const filesReq = fetch("/data/files.csv").then(async response => {
		return await response.body.getReader().read();
	});
	const kmersReq = fetch("/data/sharedKmers.csv").then(async response => {
		return await response.body.getReader().read();
	});
</script>

<main>
	{#await info }
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