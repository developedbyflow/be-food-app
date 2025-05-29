// use this after you configure husky
export default {
  parserPreset: {
    parserOpts: {
      headerPattern: /^([a-z]+)\(([a-z-]+\/[a-z-]+)\)#([A-Z]+-\d+): (.+)$/,
      headerCorrespondence: ['type', 'scope', 'ticket', 'subject'],
    },
  },
  rules: {
    'header-match-pattern': [2, 'always'],
    'header-max-length': [2, 'always', 100],
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'chore', // Maintenance
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'docs', // Documentation only
        'test', // Adding or fixing tests
        'perf', // Performance improvement
        'style', // Code style (formatting, missing semi, etc)
      ],
    ],
    'subject-empty': [2, 'never'],
    'subject-case': [0],
  },
  plugins: [
    {
      rules: {
        'header-match-pattern': (parsed) => {
          const { type, scope, ticket, subject } = parsed;
          if (type && scope && ticket && subject) {
            return [true];
          }
          return [
            false,
            'Commit message format is invalid. Use: action(epic/story)#ticket: message\n' +
              'Example: fix(boilerplate/folder-structure)#TICKET-123: implement initial folder structure',
          ];
        },
      },
    },
  ],
};
