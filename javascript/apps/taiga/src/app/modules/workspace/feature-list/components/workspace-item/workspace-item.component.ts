/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  animate,
  style,
  transition,
  trigger,
  AnimationEvent,
} from '@angular/animations';
import { Store } from '@ngrx/store';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import { Observable } from 'rxjs';
import { fetchWorkspaceProjects } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { selectWorkspaceProject } from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { RxState } from '@rx-angular/state';
import { map } from 'rxjs/operators';

interface ViewModel {
  projectsToShow: number;
  showAllProjects: boolean;
  projects: WorkspaceProject[];
  invitations: WorkspaceProject[];
  showMoreProjects: boolean;
  showLessProjects: boolean;
  remainingProjects: number;
}

interface State {
  projectsToShow: number;
  showAllProjects: boolean;
  projects: WorkspaceProject[];
  invitations: WorkspaceProject[];
  workspaceProjects: WorkspaceProject[];
}

@Component({
  selector: 'tg-workspace-item',
  templateUrl: './workspace-item.component.html',
  styleUrls: ['./workspace-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    trigger('slideOut', [
      transition(':leave', [
        style({ zIndex: 1 }),
        animate(
          '0.3s ease',
          style({
            transform: 'translateX(-120%)',
            opacity: 0,
          })
        ),
      ]),
    ]),
    trigger('reorder', [
      transition(':enter', [style({ display: 'none' }), animate('0.3s')]),
      transition('* => moving', [
        animate(
          '0.3s ease',
          style({
            transform: 'translateX(-100%)',
          })
        ),
      ]),
    ]),
  ],
})
export class WorkspaceItemComponent implements OnInit, OnChanges {
  @Input()
  public workspace!: Workspace;

  @Input()
  public set projectsToShow(projectsToShow: number) {
    this.state.set({
      projectsToShow: projectsToShow <= 3 ? 3 : projectsToShow,
    });
  }

  public model$!: Observable<ViewModel>;

  public reorder: Record<string, string> = {};

  public animationDisabled = false;

  constructor(
    private store: Store,
    private state: RxState<State>,
    private localStorageService: LocalStorageService
  ) {}

  public get gridClass() {
    return `grid-items-${this.state.get('projectsToShow')}`;
  }

  public getRejectedInvites(): Project['slug'][] {
    return (
      this.localStorageService.get<Project['slug'][] | undefined>(
        'general_rejected_invites'
      ) ?? []
    );
  }

  public ngOnInit() {
    this.state.connect(
      'workspaceProjects',
      this.store.select(selectWorkspaceProject(this.workspace.slug))
    );

    this.model$ = this.state.select().pipe(
      map((state) => {
        let invitations = state.invitations;
        let projects = state.workspaceProjects;

        const invitationProjects = projects.filter((project) => {
          return invitations.find((invitation) => {
            return invitation.slug === project.slug;
          });
        });

        // workspace admin may have an invitation to a project that it already has access to.
        projects = projects.filter((project) => {
          return !invitations.find((invitation) => {
            return invitation.slug === project.slug;
          });
        });

        if (!state.showAllProjects) {
          invitations = state.invitations.slice(0, state.projectsToShow);
          projects = projects.slice(
            0,
            state.projectsToShow - invitations.length
          );
        }

        const showMoreProjects =
          !state.showAllProjects &&
          this.workspace.totalProjects +
            state.invitations.length -
            invitationProjects.length >
            state.projectsToShow;

        const showLessProjects =
          state.showAllProjects &&
          this.workspace.totalProjects +
            state.invitations.length -
            invitationProjects.length >
            state.projectsToShow;

        const remainingProjects =
          this.workspace.totalProjects +
          state.invitations.length -
          state.projectsToShow -
          invitationProjects.length;

        return {
          ...state,
          projects,
          invitations,
          showMoreProjects,
          showLessProjects,
          remainingProjects,
        };
      })
    );
  }

  public getSiblingsRow(slug: string) {
    const projectsToShow = this.state.get('projectsToShow');

    const result = [
      ...this.state.get('invitations'),
      ...this.state.get('workspaceProjects'),
    ].reduce((result, item, index) => {
      const chunkIndex = Math.floor(index / projectsToShow);

      if (!result[chunkIndex]) {
        result[chunkIndex] = [];
      }

      result[chunkIndex].push(item);

      return result;
    }, [] as Array<WorkspaceProject[]>);

    return result.find((chunk) => {
      return chunk.find((project) => project.slug === slug);
    });
  }

  public trackByLatestProject(index: number, project: WorkspaceProject) {
    return project.slug;
  }

  public rejectProjectInvite(slug: Project['slug']) {
    const rejectedInvites = this.getRejectedInvites();
    rejectedInvites.push(slug);
    this.localStorageService.set('general_rejected_invites', rejectedInvites);

    if (this.workspace.myRole !== 'admin') {
      const siblings = this.getSiblingsRow(slug);

      if (siblings) {
        const rejectedIndex = siblings.findIndex(
          (project) => project.slug === slug
        );
        siblings.forEach((project, index) => {
          if (index > rejectedIndex) {
            this.reorder[project.slug] = 'moving';
          }
        });
      }

      this.state.set({
        invitations: this.state.get('invitations').filter((invitation) => {
          return invitation.slug !== slug;
        }),
      });
    }
  }

  public reorderDone(event: AnimationEvent) {
    if (event.fromState === null && event.toState === 'moving') {
      this.reorder = {};
    }
  }

  public setShowAllProjects(showAllProjects: boolean) {
    this.state.set({ showAllProjects });
    this.store.dispatch(fetchWorkspaceProjects({ slug: this.workspace.slug }));

    if (!showAllProjects) {
      this.animationDisabled = true;

      requestAnimationFrame(() => {
        this.animationDisabled = false;
      });
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.workspace) {
      const rejectedInvites = this.getRejectedInvites();

      const invitations = this.workspace.invitedProjects.filter((project) => {
        return !rejectedInvites.includes(project.slug);
      });

      this.state.set({ invitations });
    }
  }
}
