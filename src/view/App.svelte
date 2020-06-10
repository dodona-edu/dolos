<script>
	const metadataReq = fetch("/data/metadata.csv").then(async response => {
		return await response.text();
	});
	const intersectionsReq = fetch("/data/intersections.csv").then(async response => {
		return await response.text();
	});
	const filesReq = fetch("/data/files.csv").then(async response => {
		return await response.text();
	});
	const kmersReq = fetch("/data/sharedKmers.csv").then(async response => {
		return await response.text();
	});
</script>

<main>
	{#await intersectionsReq }
	<h1>Loading...</h1>
	{:then intersections }
	<h1>Dolos found { intersections.split("\n").length } results.</h1>
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