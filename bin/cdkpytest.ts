#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkpytestStack } from '../lib/cdkpytest-stack';

const app = new cdk.App();
new CdkpytestStack(app, "CdkpytestStack", {
  env: {
    region: "ap-northeast-1",
  },
});
