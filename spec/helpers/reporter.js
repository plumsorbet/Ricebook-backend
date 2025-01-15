const JasmineReporters = require('jasmine-reporters');

const junitReporter = new JasmineReporters.JUnitXmlReporter({
    savePath: './test-results',
    consolidateAll: false
});

jasmine.getEnv().addReporter(junitReporter);
