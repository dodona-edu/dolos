<script lang="ts">
	import * as d3 from "d3";
	import Data from "./data";
    import Test from "./test.svelte";
	import IntersectionsTable from "./IntersectionsTable.svelte";

	const data = new Data();

	//const metadataCSV = d3.csv("/data/metadata.csv");

	//const kmersCSV = d3.csv("/data/sharedKmers.csv");
</script>

<main>
    <Test />
	{#await data.intersections() }
		<h1>Loading data...</h1>
	{:then intersections }
		<h1>Dolos found { intersections.length } results.</h1>
		<IntersectionsTable intersections={intersections} />
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
