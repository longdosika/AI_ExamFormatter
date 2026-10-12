function score(answers, truth) {
  const grouped = new Map();
  let correct = 0, wrong = 0, missing = 0, falsePositive = 0, invalid = 0;
  for (const answer of answers) {
    if (!answer || !Number.isInteger(answer.id) || typeof answer.key !== 'string') { invalid++; continue; }
    if (!Object.hasOwn(truth, answer.id)) { falsePositive++; continue; }
    const values = grouped.get(answer.id) || [];
    values.push(answer.key); grouped.set(answer.id, values);
  }
  for (const [id, expected] of Object.entries(truth)) {
    const actual = grouped.get(Number(id)) || [];
    if (expected === null) falsePositive += actual.length;
    else if (!actual.length) missing++;
    else if (actual.length === 1 && actual[0] === expected) correct++;
    else wrong += actual.length;
  }
  const marked = Object.values(truth).filter(value => value !== null).length;
  return { correct, wrong, missing, falsePositive, invalid, marked,
    recall: marked ? correct / marked : 0,
    precision: correct / (correct + wrong + falsePositive + invalid) || 0 };
}
function complete(data, expectedModel = data?.modelIdentity?.name) {
  if (!data?.runtime?.version || !data?.modelIdentity?.digest || data.modelIdentity.name !== expectedModel) return false;
  const pages = data.fixtures?.map(fixture=>fixture.page);
  if (!pages?.length) return false;
  const expectedPages = [...pages,pages[0]];
  return data?.runs?.length === expectedPages.length && data.runs.every((run,index)=>{
    const fixture = data.fixtures[index % data.fixtures.length];
    const truth = fixture.truth;
    const marked = truth && Object.values(truth).filter(value=>value!==null).length;
    const validScore = score => score && ['correct','wrong','missing','falsePositive','invalid','marked'].every(key=>Number.isInteger(score[key])&&score[key]>=0) &&
      ['precision','recall'].every(key=>Number.isFinite(score[key])&&score[key]>=0&&score[key]<=1) && score.marked===marked;
    return run.model===expectedModel && run.page === expectedPages[index] && run.caseId===fixture.caseId && run.sourceSha256===fixture.sha256 && JSON.stringify(run.truth)===JSON.stringify(fixture.truth) && !run.error && !run.parseError && run.doneReason !== 'length' &&
      validScore(run.acceptedScore) && validScore(run.rawScore) && run.rawScore.invalid===0;
  });
}
function fingerprint(data) {
  return JSON.stringify({prompt:data.prompt,settings:data.settings,runtime:data.runtime?.version,
    fixtures:data.fixtures?.map(f=>({page:f.page,sha256:f.sha256,truth:f.truth,questions:f.questions}))});
}
function comparable(reports) {
  return reports.length === 2 && reports.every(report=>complete(report.data,report.model)) && fingerprint(reports[0].data) === fingerprint(reports[1].data);
}
module.exports = { score, complete, comparable };
