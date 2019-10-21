import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import { getWorkspace } from '@schematics/angular/utility/config';

import * as path from 'path';
import { expect } from 'chai';

import { createTestApp } from '../testing/workspace';
import { Schema } from './schema';
import { angularCalendarVersion, momentVersion } from './version-names';
import { getProjectFromWorkspace, getProjectTargetOptions } from '../utils';

const collectionPath = path.join(__dirname, '../collection.json');

export interface PackageJson {
  dependencies: DependencyMap;
  devDependencies: DependencyMap;
}

export interface DependencyMap {
  [dependenyName: string]: string;
}

const defaultAngularCalendarStylePath =
  'node_modules/angular-calendar/css/angular-calendar.css';

describe('angular-calendar schematics', () => {
  const projectName = 'angular-calendar-app';
  const defaultOptions = {} as Schema;
  let tree: UnitTestTree;
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let packageJsonPath: string;
  let packageJson: PackageJson;

  beforeEach(async () => {
    appTree = await createTestApp({ name: projectName });
    runner = new SchematicTestRunner(
      'angular-calendar-schematics',
      collectionPath
    );
    packageJsonPath = '/package.json';
  });

  it('should add angular-calendar to dependencies', async () => {
    const { name, version } = {
      name: 'angular-calendar',
      version: angularCalendarVersion
    };
    tree = await runner
      .runSchematicAsync('ng-add', defaultOptions, appTree)
      .toPromise();
    packageJson = JSON.parse(tree.readContent(packageJsonPath));
    expect(packageJson.dependencies[name]).equal(version);
  });

  it('should add date adapter to dependencies based on option selected ', async () => {
    const { name, version } = { name: 'moment', version: momentVersion };
    defaultOptions.dateAdapter = 'moment';
    tree = await runner
      .runSchematicAsync('ng-add', defaultOptions, appTree)
      .toPromise();
    packageJson = JSON.parse(tree.readContent(packageJsonPath));
    expect(packageJson.dependencies[name]).equal(version);
  });

  it('should schedule install dependencies task', async () => {
    await runner
      .runSchematicAsync('ng-add', defaultOptions, appTree)
      .toPromise();
    const tasks = runner.tasks;
    expect(tasks.length).to.equal(1);
  });

  it('should import angular-calendar module to root module', async () => {
    const rootModulePath = `/projects/${projectName}/src/app/app.module.ts`;
    tree = await runner
      .runSchematicAsync('ng-add', defaultOptions, appTree)
      .toPromise();
    expect(tree.files).contain(rootModulePath);

    const rootModule = tree.readContent(rootModulePath);

    const calendarModuleImport = `import { CalendarModule } from 'angular-calendar'`;
    expect(rootModule).contain(calendarModuleImport);
  });

  it('should add angular-calendar css to architect builder', async () => {
    tree = await runner
      .runSchematicAsync('ng-add', defaultOptions, appTree)
      .toPromise();

    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace);
    const styles = getProjectTargetOptions(project, 'build').styles;
    const stylesTest = getProjectTargetOptions(project, 'test').styles;

    expect(styles[1]).to.contains({ input: defaultAngularCalendarStylePath });
    expect(stylesTest[1]).to.contains({
      input: defaultAngularCalendarStylePath
    });
  });
});
