import { CLAUSES, SKILLS, STUDY_STATUS } from '../../../../packages/curriculum/src';
import { h } from '../dom';
import { ALL_LABS, PAGES } from '../labs';

/** What this app is, what is official, what is reviewed and where data lives. Counts come from the code, so they cannot drift. */
export function aboutPage(): HTMLElement {
  const sec = (title: string, ...items: (string | Node)[]) => h('section', { class: 'panel about-sec' }, h('h3', {}, title), h('ul', {}, ...items.map(i => h('li', {}, i))));
  return h(
    'div',
    { class: 'aboutpage', lang: 'en' },
    h(
      'header',
      { class: 'labhead' },
      h('p', { class: 'eyebrow' }, 'About and trust'),
      h('h2', {}, 'What this app is, and what it is not'),
      h('p', { class: 'lead' }, 'Accounting Universe helps Class XI and XII students of CBSE Accountancy (055, 2026-27) learn by doing. Read this page to know what you can rely on.'),
    ),
    sec(
      'What is in it',
      `${CLAUSES.length} syllabus topics, each with a study page (notes, formats, steps, common mistakes, a worked example).`,
      `${ALL_LABS.length + PAGES.length} visual labs and tools, and ${SKILLS.length} practice question generators whose answers are computed by an accounting engine, never typed in.`,
      'A full practice paper in the board pattern, with a marking scheme and a print view.',
    ),
    sec(
      'What is official, and what is ours',
      'The syllabus topics, unit marks and the Class XII paper pattern follow the CBSE Curriculum and Sample Question Paper 2026-27. Topics outside that syllabus are left out on purpose.',
      'All notes, questions and examples are written for this app. Nothing is copied from any textbook or past paper.',
      'CBSE has published no Class XI sample paper, so the Class XI practice paper is labelled as not official.',
    ),
    sec(
      'What has been checked',
      'Every figure the questions produce is checked by automated tests against hand-worked answers.',
      STUDY_STATUS,
      'The Hindi text is a machine-assisted draft and has not been reviewed by a Hindi-medium teacher. It is marked as a draft wherever it is shown.',
    ),
    sec(
      'Your data',
      'Your answers and progress are saved on this device only, in your browser. They are not sent anywhere and there is no account.',
      'The AI tutor, if your school switches it on, receives only the question and the figures the engine computed, never your name or progress.',
      'Clearing your browser data erases your progress. Use the progress page to export your progress first.',
    ),
    sec(
      'Limits you should know',
      'This is a practice and revision tool, not a replacement for your teacher or the textbook.',
      'Questions are shorter than many board questions; a long board question is shown as a set of linked parts.',
      'Marks lists, notes and sample answers are not an official CBSE marking scheme.',
    ),
  );
}
