# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Depends, Query, Response
from taiga.base.api import Request
from taiga.base.api.pagination import PaginationQuery, set_pagination
from taiga.base.api.permissions import Or, check_permissions
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.invitations.permissions import HasPendingProjectInvitation
from taiga.permissions import CanViewProject, IsProjectAdmin
from taiga.projects.api import get_project_or_404
from taiga.projects.models import Project
from taiga.projects.validators import PermissionsValidator
from taiga.roles import services as roles_services
from taiga.roles.models import Membership, Role
from taiga.roles.serializers import MembershipSerializer, RoleSerializer
from taiga.roles.services import exceptions as services_ex
from taiga.routers import routes

# PERMISSIONS
GET_PROJECT_ROLES = IsProjectAdmin()
UPDATE_PROJECT_ROLE_PERMISSIONS = IsProjectAdmin()
GET_PROJECT_MEMBERSHIPS = Or(CanViewProject(), HasPendingProjectInvitation())


################################################
# ROLES
################################################


@routes.projects.get(
    "/{slug}/roles",
    name="project.permissions.get",
    summary="Get project roles permissions",
    response_model=list[RoleSerializer],
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_project_roles(
    request: Request, slug: str = Query(None, description="the project slug (str)")
) -> list[Role]:
    """
    Get project roles and permissions
    """

    project = await get_project_or_404(slug)
    await check_permissions(permissions=GET_PROJECT_ROLES, user=request.user, obj=project)
    return await roles_services.get_project_roles(project=project)


@routes.projects.put(
    "/{slug}/roles/{role_slug}/permissions",
    name="project.permissions.put",
    summary="Edit project roles permissions",
    response_model=RoleSerializer,
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def update_project_role_permissions(
    request: Request,
    form: PermissionsValidator,
    slug: str = Query(None, description="the project slug (str)"),
    role_slug: str = Query(None, description="the role slug (str)"),
) -> Role:
    """
    Edit project roles permissions
    """

    project = await get_project_or_404(slug)
    await check_permissions(permissions=UPDATE_PROJECT_ROLE_PERMISSIONS, user=request.user, obj=project)
    role = await get_project_role_or_404(project=project, slug=role_slug)

    try:
        await roles_services.update_role_permissions(role, form.permissions)
    except services_ex.NonEditableRoleError as exc:
        raise ex.ForbiddenError(str(exc))

    return await get_project_role_or_404(project=project, slug=role_slug)


################################################
# MEMBERSHIPS
################################################


@routes.projects.get(
    "/{slug}/memberships",
    name="project.memberships.get",
    summary="Get project memberships",
    response_model=list[MembershipSerializer],
    responses=ERROR_404 | ERROR_422,
)
async def get_project_memberships(
    request: Request,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
    slug: str = Query(None, description="the project slug (str)"),
) -> list[Membership]:
    """
    Get project memberships
    """

    project = await get_project_or_404(slug)
    await check_permissions(permissions=GET_PROJECT_MEMBERSHIPS, user=request.user, obj=project)

    pagination, memberships = await roles_services.get_paginated_project_memberships(
        project=project, offset=pagination_params.offset, limit=pagination_params.limit
    )

    set_pagination(response=response, pagination=pagination)

    return memberships


################################################
# COMMONS
################################################


async def get_project_role_or_404(project: Project, slug: str) -> Role:
    role = await roles_services.get_project_role(project=project, slug=slug)
    if role is None:
        raise ex.NotFoundError(f"Role {slug} does not exist")

    return role
