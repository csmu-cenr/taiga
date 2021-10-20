/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { newProjectFeature } from './reducers/new-project.reducer';
import { EffectsModule } from '@ngrx/effects';
import { NewProjectEffects } from './effects/new-project.effects';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WorkspaceAvatarModule } from '~/app/shared/workspace-avatar/workspace-avatar.module';
import {
  TuiSvgModule,
  TuiDataListModule,
  TuiTextfieldControllerModule,
  TuiButtonModule,
} from '@taiga-ui/core';
import { TuiSelectModule, TuiDataListWrapperModule } from '@taiga-ui/kit';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';

import { NewProjectComponent } from './components/new-project/new-project.component';
import { TemplateStepComponent } from './components/template-step/template-step.component';
import { RouterModule } from '@angular/router';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';

@NgModule({
  declarations: [
    NewProjectComponent,
    TemplateStepComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TranslocoModule,
    StoreModule.forFeature(newProjectFeature),
    EffectsModule.forFeature([NewProjectEffects]),
    TuiSvgModule,
    FormsModule,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    WorkspaceAvatarModule,
    TuiTextfieldControllerModule,
    RouterModule,
    TuiButtonModule,
    InputsModule,
  ],
  exports: [NewProjectComponent, TemplateStepComponent],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'new_project',
        alias: 'new_project'
      }
    }
  ]
})
export class NewProjectModule {}
