# Introduction

Dolos is a command-line application for source code plagiarism detection. It 
uses [tree-sitter](https://tree-sitter.github.io/tree-sitter/), an incremental
parser library, to support a broad range of programming languages. 


- [Try Dolos](/try/)
- [Install Dolos](/guide/installation.html)
- [How to use Dolos](/guide/running.html)

By using powerful visualizations, you can see in a glance how similar the analyzed files are. See for example the difference between the submissions for the same exercise used for an test (left) and later as a mandatory exercise (right):

![Two plagiarism graphs. The first plagiarism graph is of solutions submitted for a test in academic year 2020-2021 with only two connected nodes in the graph. The second plagiarism graph is of the same exercise given as a mandatory exercise in the academic year 2021-2022 and shows a lot of connected nodes, indicating a lot of plagiarism.](/images/comparison-exercise-evaluation.png)

## Why a new tool?

We noticed that existing tools were lacking in a lot of ways. Some of them are provided as a website only, which was often offline and had an archaic interface. Others did not support the programming languages we wanted to use or were simply too difficult to get up and running ...

With Dolos, we want to provide an **open-source** tool which you can easily extend and integrate in your own workflow. It should be **easy to install** and have a **modern user interface**. Finally, we want teachers to be **as effective as possible** in detecting and preventing plagiarism, giving them more time do do what they do best: teaching.

![Screenshot of the Dolos Web UI showing an overview of the analyzed submissions and a histogram with the similarity distribution](/images/dolos-screenshot.png)

## Who made this software?

Dolos is an active research project by [Team Dodona](https://dodona.ugent.be/en/about/) at Ghent University. If you use this software for your research, please cite:

> Maertens et. al. (2022) J. Computer Assisted Learning [doi:10.1111/jcal.12662](https://doi.org/10.1111/jcal.12662)

[![Header of the article titled "Dolos: Language-agnostic plagiarism detection in source code"](/images/dolos-article.png)](https://doi.org/10.1111/jcal.12662)

## What's in a name?

Dolos is properly named after the spirit of trickery and guile in Greek
mythology. His [bio on Wikipedia](https://en.wikipedia.org/wiki/Dolos_(mythology))
reads as:

_He became known for his skill when attempting to make a fraudulent
copy statue of Aletheia , in order to trick people into thinking they were
seeing the real statue. He ran out of the clay he was using to create the
statue, and had to leave the feet unfinished as he quaked in fear while his
skill-master looked over his attempt at deceitfulness. To his surprise,
Prometheus was rather amazed at the similarity between the statues, so Dolos
then became a master in cunning deception, craftiness, and treachery. There are
even some stories of Dolos tricking gods into lies._
