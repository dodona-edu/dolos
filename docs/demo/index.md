---
sidebar: false
---
# Examples

On this page you can find the results of a plagiarism analysis for a few different cases.

## Try on your own data!

If you want to run Dolos yourself, you can follow our [quick start guide](/docs/server.md).

## Classroom dataset

This analysis was performed on submissions for the same exercise: once as a graded test where no communication was allowed between students, and once as a mandatory exercise where collaboration is expected between small groups of students.

<div class="row">
<div class="column center">

### Test assignment

[![Plagiarism graph of the submissions for a programming exercise on a test](/images/demo-evaluation-graph.png)](https://dolos.ugent.be/demo/pyramidal-constants/evaluation/)

<div class="center-content">
<a class="link-button" target="_blank" href="https://dolos.ugent.be/demo/pyramidal-constants/evaluation/">Test assignment</a>
</div>

Analysis performed on all 169 submissions for a test assignment where no communication was allowed between students. All students submitted unique solutions during the test, except for two students who confessed they exchanged a solution during the test.


</div>
<div class="column">

### Mandatory assignment

[![Plagiarism graph of submissions for a mandatory programming exercise where collaboration is allowed](/images/demo-exercise-graph.png)](https://dolos.ugent.be/demo/pyramidal-constants/exercise/)


<div class="center-content">
<a class="link-button" target="_blank" href="https://dolos.ugent.be/demo/pyramidal-constants/exercise/#/">Exercise assignment</a>
</div>

Analysis performed on all 392 submissions for a mandatory assignment. Communication and collaboration is allowed. Students work either individually or in groups of two or three students, but we also observe some clusters of four or more students that exchanged solutions and submitted them with hardly any varying types and amounts of modifications.

</div>
</div>

## Benchmark dataset

These reports shows how Dolos performs on the [SOCO dataset](https://pan.webis.de/fire14/pan14-web/soco.html). The inputs of Dolos were enhanced by adding [labels](../docs/running.html#adding-metadata)
indicating whether a file is involved in plagiarism (orange) or not (blue).

Note that these labels were added manually by experts, but they might not be fully accurate. Some submissions look very similar although they are not labeled as plagiarism.


<div class="row">
<div class="column center">

### Java

[![Plagiarism graph of the Java files in the SOCO dataset](/images/soco-java-graph.png)](https://dolos.ugent.be/demo/soco/java/#/graph)

<div class="center-content">
<a class="link-button" target="_blank" href="https://dolos.ugent.be/demo/soco/java/#/"> Java dataset</a>
</div>

A set of 259 Java files, of which 115 files are labeled as plagiarism.

</div>
<div class="column">

### C

[![Plagiarism graph of the C files in the SOCO dataset](/images/soco-c-graph.png)](https://dolos.ugent.be/demo/soco/c/#/graph)

<div class="center-content">
<a class="link-button" target="_blank" href="https://dolos.ugent.be/demo/soco/c/#/">C dataset</a>
</div>

A set of 79 C files, of which 37 files are labeled as plagiarism.

</div>
</div>
