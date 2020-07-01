<script lang="ts">
    /// <reference types="../types/smui-data-table" />
    import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
    export let intersections;
</script>

<DataTable table$aria-label="Intersections">
    <Head>
        <Row>
            <Cell>Left file</Cell>
            <Cell>Right file</Cell>
            <Cell>Similarity</Cell>
        </Row>
    </Head>
    <Body>
    {#each intersections as intersection }
        <Row>
            <Cell>{ intersection.leftFile }</Cell>
            <Cell>{ intersection.rightFile }</Cell>
            <Cell>{ intersection.similarity }</Cell>
        </Row>
    {/each}
    </Body>
</DataTable>