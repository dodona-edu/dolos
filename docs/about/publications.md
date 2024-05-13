---
layout: page
title: Publications
---

<script setup>
import Publication from '@components/Publication.vue';
import Publications from '@components/Publications.vue';
import PublicationsPage from '@components/PublicationsPage.vue';
</script>

<PublicationsPage>
    <Publications
        title="Publications involving Dolos"
        lead="List of publications directly involving Dolos. If you use Dolos for your own research, please cite these.">
        <Publication
            title="Discovering and exploring cases of educational source code plagiarism with Dolos"
            authors="Rien Maertens, Charlotte Van Petegem, Niko Strijbol, Toon Baeyens, Arne Carla Jacobs, Peter Dawyndt, Bart Mesuere"
            journal="SoftwareX"
            year="2024"
            doi="https://doi.org/10.1016/j.softx.2024.101755"
            image="/images/maertens-2024.png">
            Source code plagiarism is a significant issue in educational practice, and educators need user-friendly tools to cope with such academic dishonesty.
            This article introduces the latest version of Dolos, a state-of-the-art ecosystem of tools for detecting and preventing plagiarism in educational source code.
            In this new version, the primary focus has been on enhancing the user experience.
            Educators can now run the entire plagiarism detection pipeline from a new web app in their browser, eliminating the need for any installation or configuration.
            Completely redesigned analytics dashboards provide an instant assessment of whether a collection of source files contains suspected cases of plagiarism and how widespread plagiarism is within the collection.
            The dashboards support hierarchically structured navigation to facilitate zooming in and out of suspect cases.
            Clusters are an essential new component of the dashboard design, reflecting the observation that plagiarism can occur among larger groups of students.
            To meet various user needs, the Dolos software stack for source code plagiarism detection now includes a self-hostable web app, a JSON application programming interface (API), a command line interface (CLI), a JavaScript library and a preconfigured Docker container.
            Clear documentation and a free-to-use instance of the web app can be found at <a href="https://dolos.ugent.be">https://dolos.ugent.be</a>.
            The source code is also available on GitHub.
        </Publication>
        <Publication
            title="Dolos: Language-agnostic plagiarism detection in source code"
            authors="Rien Maertens, Charlotte Van Petegem, Niko Strijbol, Toon Baeyens, Arne Carla Jacobs, Peter Dawyndt, Bart Mesuere"
            journal="Journal of Computer Assisted Learning"
            year="2022"
            doi="https://doi.org/10.1111/jcal.12662"
            image="/images/maertens-2022.png">
            Learning to code is increasingly embedded in secondary and higher education curricula, where solving programming exercises plays an important role in the learning process and in formative and summative assessment. Unfortunately, students admit that copying code from each other is a common practice and teachers indicate they rarely use plagiarism detection tools.
            We want to lower the barrier for teachers to detect plagiarism by introducing a new source code plagiarism detection tool (Dolos) that is powered by state-of-the art similarity detection algorithms, offers interactive visualizations, and uses generic parser models to support a broad range of programming languages.
            Dolos is compared with state-of-the-art plagiarism detection tools in a benchmark based on a standardized dataset. We describe our experience with integrating Dolos in a programming course with a strong focus on online learning and the impact of transitioning to remote assessment during the COVID-19 pandemic.
            Dolos outperforms other plagiarism detection tools in detecting potential cases of plagiarism and is a valuable tool for preventing and detecting plagiarism in online learning environments. It is available under the permissive MIT open-source license at <a href="https://dolos.ugent.be">https://dolos.ugent.be</a>.
        </Publication>
    </Publications>
    <Publications title="Publications by Team Dodona" lead="Dolos is developed by a larger team focussed around educational technology. Below is a list of articles published by other researchers in our group.">
        <Publication
            title="Mining patterns in syntax trees to automate code reviews of student solutions for programming exercise"
            authors="Charlotte Van Petegem, Kasper Demeyere, Rien Maertens, Niko Strijbol, Bram De Wever, Bart Mesuere, Peter Dawyndt"
            journal="arXiv preprint"
            year="2024"
            doi="https://doi.org/10.48550/arXiv.2405.01579"
            image="/images/vanpetegem-2024.png">
            In programming education, providing manual feedback is essential but labour-intensive, posing challenges in consistency and timeliness. We introduce ECHO, a machine learning method to automate the reuse of feedback in educational code reviews by analysing patterns in abstract syntax trees. This study investigates two primary questions: whether ECHO can predict feedback annotations to specific lines of student code based on previously added annotations by human reviewers (RQ1), and whether its training and prediction speeds are suitable for using ECHO for real-time feedback during live code reviews by human reviewers (RQ2). Our results, based on annotations from both automated linting tools and human reviewers, show that ECHO can accurately and quickly predict appropriate feedback annotations. Its efficiency in processing and its flexibility in adapting to feedback patterns can significantly reduce the time and effort required for manual feedback provisioning in educational settings. 
        </Publication>
        <Publication
            title="Dodona: Learn to code with a virtual co-teacher that supports active learning"
            authors="Charlotte Van Petegem, Rien Maertens, Niko Strijbol, Jorg Van Renterghem, Felix Van der Jeugt, Bram De Wever, Peter Dawyndt, Bart Mesuere"
            journal="SoftwareX"
            year="2023"
            doi="http://doi.org/10.1016/j.softx.2023.101578"
            image="/images/vanpetegem-2023.png">
          Dodona (dodona.ugent.be) is an intelligent tutoring system for computer programming. It provides real-time data and feedback to help students learn better and teachers teach better. Dodona is free to use and has more than 61 thousand registered users across many educational and research institutes, including 20 thousand new users in the last year. The source code of Dodona is available on GitHub under the permissive MIT open-source license. This paper presents Dodona and its design and look-and-feel. We highlight some of the features built into Dodona that make it possible to shorten feedback loops, and discuss an example of how these features can be used in practice. We also highlight some of the research opportunities that Dodona has opened up and present some future developments.
        </Publication>
        <Publication
            title="Blink: An Educational Software Debugger for Scratch"
            journal="Proceedings of the 2023 Conference on Innovation and Technology in Computer Science Education"
            authors="Niko Strijbol, Christophe Scholliers, Peter Dawyndt"
            year="2023"
            doi="https://doi.org/10.1145/3587103.3594189"
            image="/images/strijbol-2023.png">
        Debugging is an important aspect of programming. Most programming languages have some features and tools to facilitate debugging. As the debugging process is also frustrating, it requires good scaffolding, in which a debugger can be a useful tool [3]. Scratch is a visual block-based programming language that is commonly used to teach programming to children, aged 10--14 [4]. It comes with its own integrated development environment (IDE), where children can edit and run their code. This IDE misses some of the tools that are available in traditional IDEs, such as a debugger. In response to this challenge, we developed Blink. Blink is a debugger for Scratch with the aim of being usable to the young audience that typically uses Scratch. We present the currently implemented features of the debugger, and the challenges we faced while implementing those, both from a user-experience standpoint and a technical standpoint.
        </Publication>
        <Publication
            title="TESTed — An educational testing framework with language-agnostic test suites for programming exercises"
            authors="Niko Strijbol, Charlotte Van Petegem, Rien Maertens, Boris Sels, Christophe Scholliers, Peter Dawyndt, Bart Mesuere"
            journal="SoftwareX"
            year="2022"
            doi="https://doi.org/10.1016/j.softx.2023.101404"
            image="/images/strijbol-2022.png">
        In educational contexts, automated assessment tools (AAT) are commonly used to provide formative feedback on programming exercises. However, designing exercises for AAT remains a laborious task or imposes limitations on the exercises. Most AAT use either output comparison, where the generated output is compared against an expected output, or unit testing, where the tool has access to the code of the submission under test. While output comparison has the advantage of being programming language independent, the testing capabilities are limited to the output. Conversely, unit testing can generate more granular feedback, but is tightly coupled with the programming language of the submission. In this paper, we introduce TESTed, which enables the best of both worlds: combining the granular feedback of unit testing with the programming language independence of output comparison. Educators can save time by designing exercises that can be used across programming languages. Finally, we report on using TESTed in educational practice.
        </Publication>
        <Publication
            title="Pass/fail prediction in programming courses"
            authors="Charlotte Van Petegem, Louise Deconinck, Dieter Mourisse, Rien Maertens, Niko Strijbol, Bart Dhoedt, Bram De Wever, Peter Dawyndt, Bart Mesuere"
            journal="Journal of Educational Computing Research"
            year="2022"
            doi="https://doi.org/10.1177/07356331221085595"
            image="/images/vanpetegem-2022.png">
        We present a privacy-friendly early-detection framework to identify students at risk of failing in introductory programming courses at university. The framework was validated for two different courses with annual editions taken by higher education students (N = 2 080) and was found to be highly accurate and robust against variation in course structures, teaching and learning styles, programming exercises and classification algorithms. By using interpretable machine learning techniques, the framework also provides insight into what aspects of practising programming skills promote or inhibit learning or have no or minor effect on the learning process. Findings showed that the framework was capable of predicting students’ future success already early on in the semester.
        </Publication>
    </Publications>
</PublicationsPage>


