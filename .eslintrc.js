module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['@fesk/standard'],
    rules: {
      'flowtype/no-types-missing-file-annotation': 0,
    }
};
