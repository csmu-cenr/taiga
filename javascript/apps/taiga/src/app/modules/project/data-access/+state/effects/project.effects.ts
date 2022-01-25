/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { map, tap } from 'rxjs/operators';

import * as ProjectActions from '../actions/project.actions';
import { ProjectApiService } from '@taiga/api';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { NavigationService } from '~/app/shared/navigation/navigation.service';
@Injectable()
export class ProjectEffects {
  public loadProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.fetchProject),
      fetch({
        run: (action) => {
          return this.projectApiService.getProject(action.slug).pipe(
            map((project) => {
              return ProjectActions.fetchProjectSuccess({ project });
            })
          );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public projectSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProjectActions.fetchProjectSuccess),
        tap(({ project }) => {
          this.navigationService.add(project);
        })
      );
    },
    { dispatch: false }
  );

  public loadMemberRoles$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.fetchMemberRoles),
      fetch({
        run: (action) => {
          return this.projectApiService.getMemberRoles(action.slug).pipe(
            map((roles) => {
              return ProjectActions.fetchMemberRolesSuccess({ roles });
            })
          );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public loadPublicRole$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.fetchPublicRoles),
      fetch({
        run: (action) => {
          return this.projectApiService.getPublicRoles(action.slug).pipe(
            map((permissions) => {
              return ProjectActions.fetchPublicRolesSuccess({
                publicRole: permissions,
              });
            })
          );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public updateRolePermissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.updateRolePermissions),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .putMemberRoles(action.project, action.roleSlug, action.permissions)
            .pipe(
              map(() => {
                return ProjectActions.updateRolePermissionsSuccess();
              })
            );
        },
        onError: () => {
          return ProjectActions.updateRolePermissionsError();
        },
      })
    );
  });

  public updatePublicRolePermissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.updatePublicRolePermissions),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .putPublicRoles(action.project, action.permissions)
            .pipe(
              map(() => {
                return ProjectActions.updateRolePermissionsSuccess();
              })
            );
        },
        onError: () => {
          return ProjectActions.updateRolePermissionsError();
        },
      })
    );
  });

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private navigationService: NavigationService
  ) {}
}
