# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
#
# The code is partially taken (and modified) from djangorestframework-simplejwt v. 4.7.1
# (https://github.com/jazzband/djangorestframework-simplejwt/tree/5997c1aee8ad5182833d6b6759e44ff0a704edb4)
# that is licensed under the following terms:
#
#   Copyright 2017 David Sanders
#
#   Permission is hereby granted, free of charge, to any person obtaining a copy of
#   this software and associated documentation files (the "Software"), to deal in
#   the Software without restriction, including without limitation the rights to
#   use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
#   of the Software, and to permit persons to whom the Software is furnished to do
#   so, subject to the following conditions:
#
#   The above copyright notice and this permission notice shall be included in all
#   copies or substantial portions of the Software.
#
#   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
#   SOFTWARE.

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import DenylistedToken, OutstandingToken


class OutstandingTokenAdmin(admin.ModelAdmin):
    list_display = (
        'token_type',
        'jti',
        'content_type',
        'content_object',
        'created_at',
        'expires_at',
    )
    search_fields = (
        'token_type',
        'content_type',
        'object_id',
        'jti',
    )
    ordering = (
        'token_type',
        'content_type',
        'content_object',
    )

    def get_queryset(self, *args, **kwargs):
        qs = super().get_queryset(*args, **kwargs)

        return qs.select_related('content_object')

    # Read-only behavior defined below
    actions = None

    def get_readonly_fields(self, *args, **kwargs):
        return [f.name for f in self.model._meta.fields]

    def has_add_permission(self, *args, **kwargs):
        return False

    def has_delete_permission(self, *args, **kwargs):
        return False

    def has_change_permission(self, request, obj=None):
        return (
            request.method in ['GET', 'HEAD'] and  # noqa: W504
            super().has_change_permission(request, obj)
        )


admin.site.register(OutstandingToken, OutstandingTokenAdmin)


class DenylistedTokenAdmin(admin.ModelAdmin):
    list_display = (
        'token_token_type',
        'token_jti',
        'token_content_type',
        'token_content_object',
        'token_created_at',
        'token_expires_at',
        'denylisted_at',
    )
    search_fields = (
        'token__token_type',
        'token__content_type',
        'token__object_id',
        'token__jti',
    )
    ordering = (
        'token__token_type',
        'token__content_type',
        'token__content_object',
    )

    def get_queryset(self, *args, **kwargs):
        qs = super().get_queryset(*args, **kwargs)

        return qs.select_related('token__content_object')

    def token_token_type(self, obj):
        return obj.token.token_type
    token_token_type.short_description = _('token_type')
    token_token_type.admin_order_field = 'token__token_type'

    def token_jti(self, obj):
        return obj.token.jti
    token_jti.short_description = _('jti')
    token_jti.admin_order_field = 'token__jti'

    def token_content_type(self, obj):
        return obj.token.content_type
    token_content_type.short_description = _('content_type')
    token_content_type.admin_order_field = 'token__content_type'

    def token_content_object(self, obj):
        return obj.token.content_object
    token_content_object.short_description = _('content_object')
    token_content_object.admin_order_field = 'token__content_object'

    def token_created_at(self, obj):
        return obj.token.created_at
    token_created_at.short_description = _('created at')
    token_created_at.admin_order_field = 'token__created_at'

    def token_expires_at(self, obj):
        return obj.token.expires_at
    token_expires_at.short_description = _('expires at')
    token_expires_at.admin_order_field = 'token__expires_at'


admin.site.register(DenylistedToken, DenylistedTokenAdmin)
