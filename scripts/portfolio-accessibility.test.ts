import assert from "node:assert/strict";
import test from "node:test";
import { projects } from "../client/src/lib/projects";

test("every portfolio image has an authored alternative matched to its project", () => {
  for (const project of projects) {
    assert.ok(project.imageAlt.trim(), `${project.title}: cover description`);
    assert.equal(project.imageAlts.length, project.images.length, project.title);
    const alternatives = [project.imageAlt, ...project.imageAlts];
    assert.equal(new Set(alternatives).size, alternatives.length, project.title);
    for (const alternative of alternatives) {
      assert.ok(alternative.trim().length > 20, alternative);
      assert.doesNotMatch(alternative, /^(slide|image|photo)\s*\d*$/i);
    }
  }
});
