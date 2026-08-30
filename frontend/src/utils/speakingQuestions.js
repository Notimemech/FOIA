/**
 * speakingQuestions.js
 * Comprehensive library of authentic Cambridge IELTS Speaking Mock Topics
 */

export const SPEAKING_PART1_SETS = [
  {
    id: 'p1_hometown',
    topic: 'Hometown & Living Area',
    questions: [
      'Where is your hometown, and what is it known for?',
      'What do you like most about living in your hometown?',
      'Is there anything you would like to improve about your hometown?',
      'Do you think you will continue living there in the future?',
      'How has your hometown changed over the past few years?'
    ]
  },
  {
    id: 'p1_work_study',
    topic: 'Work & Studies',
    questions: [
      'Do you work or are you a student?',
      'Why did you choose this field of work or study?',
      'What is the most challenging aspect of your daily routine?',
      'Do you plan to continue in this career path in the future?',
      'What helps you stay focused and productive throughout the day?'
    ]
  },
  {
    id: 'p1_technology',
    topic: 'Technology & Communication',
    questions: [
      'How often do you use electronic devices for study or work?',
      'What is your favorite mobile application and why?',
      'Do you prefer messaging people or making phone calls?',
      'Do you think technology makes people more or less connected?',
      'How has the internet changed the way you learn new things?'
    ]
  },
  {
    id: 'p1_music',
    topic: 'Music & Leisure',
    questions: [
      'What type of music do you enjoy listening to most?',
      'Did you learn to play any musical instruments when you were younger?',
      'Do you prefer listening to live music or recorded tracks at home?',
      'How does music influence your mood and emotional state?',
      'Do you think music education is important for young children?'
    ]
  }
];

export const SPEAKING_PART2_3_SETS = [
  {
    id: 'p23_journey',
    topic: 'A Memorable Journey',
    part2: {
      cueCard: 'Describe a memorable journey you have made.\n\nYou should say:\n• Where you went and who you went with\n• How you travelled there\n• What you did during this journey\n\nAnd explain why this journey was particularly memorable to you.'
    },
    part3: {
      topic: 'Travel & Tourism in the Modern World',
      questions: [
        'How has international travel changed compared to several decades ago?',
        'What are the main environmental challenges associated with mass tourism, and how can they be mitigated?',
        'Do you believe travelling independently provides more value than joining organized package tours? Why?'
      ]
    }
  },
  {
    id: 'p23_skill',
    topic: 'A Useful Skill Learned',
    part2: {
      cueCard: 'Describe a useful practical skill you learned recently.\n\nYou should say:\n• What the skill is and why you decided to learn it\n• How you learned it (self-study, mentor, courses)\n• How long it took you to become proficient\n\nAnd explain how this skill has helped you in your daily life or career.'
    },
    part3: {
      topic: 'Education & Future Skills',
      questions: [
        'What essential skills will be most valued in the automated workforce of the future?',
        'Should schools prioritize practical life skills alongside traditional academic subjects?',
        'How does online learning compare with traditional classroom instruction when acquiring hands-on skills?'
      ]
    }
  },
  {
    id: 'p23_environment',
    topic: 'An Environmental Problem',
    part2: {
      cueCard: 'Describe an environmental issue in your country that concerns you.\n\nYou should say:\n• What the problem is and where it occurs\n• What causes this issue\n• What effects it has on local communities and nature\n\nAnd explain what measures should be implemented to address it.'
    },
    part3: {
      topic: 'Environmental Responsibility & Sustainability',
      questions: [
        'Whose responsibility is it primarily to combat climate change: governments, corporations, or individual citizens?',
        'How effective are international climate agreements in holding developing and developed nations accountable?',
        'Can technological innovations alone solve our ecological crises without changes in human consumption habits?'
      ]
    }
  }
];

export const SPEAKING_FULL_TEST_SETS = [
  {
    id: 'full_test_1',
    title: 'Full Simulation 1: Daily Life, Personal Resilience & Modern Society',
    part1: {
      topic: 'Daily Routine & Leisure',
      questions: [
        'What is your favorite time of the day and why?',
        'Do you usually plan your daily schedule in advance or act spontaneously?',
        'What hobbies do you enjoy doing during your weekends?',
        'Do you prefer spending your free time alone or with family and friends?',
        'How do you unwind after a long and stressful day?'
      ]
    },
    part2: {
      cueCard: 'Describe a challenging situation you successfully overcame.\n\nYou should say:\n• What the challenge was and when it happened\n• Why it was difficult for you\n• What steps you took to resolve it\n\nAnd explain what valuable lesson you learned from this experience.'
    },
    part3: {
      topic: 'Personal Growth & Problem Solving',
      questions: [
        'Why do some individuals adapt more resiliently to unexpected hardships than others?',
        'How can parents and educators foster problem-solving skills in young people?',
        'Do high-pressure work environments produce better performance or higher burnout rates?'
      ]
    }
  },
  {
    id: 'full_test_2',
    title: 'Full Simulation 2: Culture, Creative Arts & Global Media',
    part1: {
      topic: 'Art, Reading & Media',
      questions: [
        'Do you enjoy visiting art galleries or historical museums?',
        'Did you read a lot of books when you were a child?',
        'Do you prefer reading physical printed books or e-books?',
        'What kind of news topics do you follow most closely?',
        'How has the way people consume news changed over the last decade?'
      ]
    },
    part2: {
      cueCard: 'Describe an artwork, book, or piece of music that left a deep impression on you.\n\nYou should say:\n• What it is and who created it\n• When and where you first encountered it\n• What it is about\n\nAnd explain why it made such a profound impression on you.'
    },
    part3: {
      topic: 'Cultural Preservation & Creative Expression',
      questions: [
        'Why is it important for societies to preserve traditional art forms in a digital era?',
        'Should national governments provide financial subsidies to support artists and cultural institutions?',
        'How does globalization influence unique regional artistic traditions?'
      ]
    }
  }
];

export const getRandomPart1Set = () => {
  const index = Math.floor(Math.random() * SPEAKING_PART1_SETS.length);
  return SPEAKING_PART1_SETS[index];
};

export const getRandomPart23Set = () => {
  const index = Math.floor(Math.random() * SPEAKING_PART2_3_SETS.length);
  return SPEAKING_PART2_3_SETS[index];
};

export const getRandomFullTestSet = () => {
  const index = Math.floor(Math.random() * SPEAKING_FULL_TEST_SETS.length);
  return SPEAKING_FULL_TEST_SETS[index];
};
