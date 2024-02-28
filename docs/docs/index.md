# Introduction

<iframe src="https://player.vimeo.com/video/913639891?h=cbff92408d&loop=1" style="padding-top: 1em; width: 100%; aspect-ratio: 16 / 9;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

Dolos is a source code plagiarism detection tool that [supports a broad range of programming languages](/about/languages).
It is available as [a web app](/docs/server) for regular users, and as a [command-line tool](/docs/installation) and a [JavaScript library](/docs/library) for more advanced users. The source code of Dolos is [open](https://github.com/dodona-edu/dolos) under the MIT license.

- [Online examples to see Dolos in action](/demo/)
- [Use Dolos on your own data](/docs/server)
- [Install Dolos CLI for offline usage](/docs/installation)

See at a glance how similar the analyzed files are from the powerful visualizations provided by Dolos. Based on our experience with teaching programming courses, Dolos focuses on two main use cases:

- **Tests and exams** where no communication or collaboration is allowed and thus no similar submissions are expected. Submissions with a high similarity or with similar fragments could a be a sign of possible cheating behavior and are immediately visible in the interface.
- **Regular exercises** where collaboration is allowed between (small) groups of students where teachers want to see if solutions are not exchanged among larger groups of students. Dolos groups submissions within clusters to easily identify problematic groups.

The following example shows different trends among submissions for the same exercise that was initially used for a test where no communication or collaboration was allowed (left) and that was later reused as a mandatory exercise where students were allowed to collaborate in small groups (right):

![Two plagiarism graphs. The first plagiarism graph is of solutions submitted for a test in academic year 2020-2021 with only two connected nodes in the graph. The second plagiarism graph is of the same exercise given as a mandatory exercise in the academic year 2021-2022 and shows a lot of connected nodes, indicating a lot of plagiarism.](/images/comparison-exercise-evaluation.png)

## Why a new tool?

We found that all existing tools were missing some important features. Some tools only came as a web app that was down regularly or had an archaic user interface. Others tools did not support the programming languages we use in our courses or were simply too difficult to get up and running or too cumbersome to use in daily practice ...

With Dolos, we want to provide an **open-source** tool that can easily be extended and integrated in your own workflow. It needs no installation (web app) or is **easy to install** (CLI) and has a **modern user interface**. As a result, we want teachers to be **as effective as possible** in detecting and preventing plagiarism, giving them more time do do what they do best: teaching.

![Screenshot of the Dolos Web UI showing an overview of the analyzed submissions and a histogram with the similarity distribution](/images/dolos-screenshot.png)

## Who made this software?

Dolos is an active research project by [Team Dodona](https://dodona.be/en/about/) at [Ghent University](https://www.ugent.be/en) (Belgium). Please use this citation if you use Dolos in your own research:

> Maertens et. al. (2022) J. Computer Assisted Learning [doi:10.1111/jcal.12662](https://doi.org/10.1111/jcal.12662)

[![Header of the article titled "Dolos: Language-agnostic plagiarism detection in source code"](/images/dolos-article.png)](https://doi.org/10.1111/jcal.12662)

See our [publications page](/about/publications) for more articles published by Team Dodona.

## What's in a name?

Dolos is properly named after the spirit of trickery and guile in Greek mythology. His [bio on Wikipedia](https://en.wikipedia.org/wiki/Dolos_(mythology)) reads as:

_He became known for his skill when attempting to make a fraudulent copy statue of Aletheia, in order to trick people into thinking they were seeing the real statue. He ran out of the clay he was using to create the statue, and had to leave the feet unfinished as he quaked in fear while his skill-master looked over his attempt at deceitfulness. To his surprise, Prometheus was rather amazed at the similarity between the statues, so Dolos then became a master in cunning deception, craftiness, and treachery. There are even some stories of Dolos tricking gods into lies._
