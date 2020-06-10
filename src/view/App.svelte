<script>
	import * as d3 from "d3";

	import { fetchFiles } from "./data.ts";
	import IntersectionsTable from "./IntersectionsTable.svelte";

	const fileMap = fetchFiles();

	let intersections = [];

	fileMap.then(files => {
		d3.csv("/data/intersections.csv", row => {
			intersections.push({
				leftFile: files[row.leftFileId],
				rightFile: files[row.rightFileId],
				...row
			})
		});
	})


	//const metadataCSV = d3.csv("/data/metadata.csv");

	//const kmersCSV = d3.csv("/data/sharedKmers.csv");
</script>

<main>
	<h1>Dolos found { intersections.length } results.</h1>
	<IntersectionsTable intersections={intersections} />
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