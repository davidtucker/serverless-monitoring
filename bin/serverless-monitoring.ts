#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ServerlessMonitoringStack } from '../lib/serverless-monitoring-stack';

const app = new cdk.App();
new ServerlessMonitoringStack(app, 'ServerlessMonitoringStack');
