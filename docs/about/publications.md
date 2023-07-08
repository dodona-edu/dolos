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
        <Publication
            title="Dolos 2.0: Towards Seamless Source Code Plagiarism Detection in Online Learning Environments"
            authors="Rien Maertens, Peter Dawyndt, Bart Mesuere"
            journal="Proceedings of the 2023 Conference on Innovation and Technology in Computer Science Education"
            year="2023"
            doi="https://doi.org/10.1145/3587103.3594166"
            image="/images/maertens-2023.png">
        With the increasing demand for programming skills comes a trend towards more online programming courses and assessments. While this allows educators to teach larger groups of students, it also opens the door to dishonest student behaviour, such as copying code from other students. When teachers use assignments where all students write code for the same problem, source code similarity tools can help to combat plagiarism. Unfortunately, teachers often do not use these tools to prevent such behaviour. In response to this challenge, we have developed a new source code plagiarism detection tool named Dolos. Dolos is open-source, supports a wide range of programming languages, and is designed to be user-friendly. It enables teachers to detect, prove and prevent plagiarism in programming courses by using fast algorithms and powerful visualisations. We present further enhancements to Dolos and discuss how it can be integrated into modern computing education courses to meet the challenges of online learning and assessment. By lowering the barriers for teachers to detect, prove and prevent plagiarism in programming courses, Dolos can help protect academic integrity and ensure that students earn their grades honestly.
        </Publication>
    </Publications>
    <Publications title="Publications by Team Dodona" lead="Dolos is developed by a larger team focussed around educational technology. Below is a list of articles published by other researchers in our group.">
        <Publication
            title="Dodona: Learn to Code with a Virtual Co-teacher that Supports Active Learning"
            authors="Charlotte Van Petegem, Peter Dawyndt, Bart Mesuere"
            journal="Proceedings of the 2023 Conference on Innovation and Technology in Computer Science Education"
            year="2023"
            doi="https://doi.org/10.1145/3587103.3594165"
            image="/images/vanpetegem-2023.png">
        Dodona (dodona.ugent.be) is an intelligent tutoring system for learning computer programming, statistics and data science. It bridges the gap between assessment and learning by providing real-time data and feedback to help students learn better, teachers teach better and educational technology become more effective. We show how Dodona can be used as a virtual co-teacher to stimulate active learning and support challenge-based education in open and collaborative learning environments. We also highlight some of the opportunities and challenges we have faced in practice. Dodona is free to use and has more than 50 thousand registered users across many educational and research institutions, including 15 thousand new users in the last year. Dodona's source code is available on GitHub under the permissive MIT open-source license.
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
            authors="Charlotte Van Petegem, Peter Dawyndt, Bart Mesuere"
            journal="Journal of Educational Computing Research"
            year="2022"
            doi="https://doi.org/10.1177/07356331221085595"
            image="/images/vanpetegem-2022.png">
        We present a privacy-friendly early-detection framework to identify students at risk of failing in introductory programming courses at university. The framework was validated for two different courses with annual editions taken by higher education students (N = 2 080) and was found to be highly accurate and robust against variation in course structures, teaching and learning styles, programming exercises and classification algorithms. By using interpretable machine learning techniques, the framework also provides insight into what aspects of practising programming skills promote or inhibit learning or have no or minor effect on the learning process. Findings showed that the framework was capable of predicting students’ future success already early on in the semester.
        </Publication>
    </Publications>
</PublicationsPage>


