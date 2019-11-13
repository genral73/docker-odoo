# -*- coding: utf-8 -*-
# Part of Odoo Module Developed by Kinfinity Tech Pvt. Ltd.
# See LICENSE file for full copyright and licensing details.

from odoo import http
from odoo.addons.web.controllers.main import WebClient, Binary, Home
from odoo.http import request

class WebCustomizeThemeColors(Home):

    def get_view_ids(self, xml_ids):
        ids = []
        for xml_id in xml_ids:
            if "." in xml_id:
                record_id = request.env.ref(xml_id).id
            else:
                record_id = int(xml_id)
            ids.append(record_id)
        return ids

    @http.route(['/web/web_customize_menu_get'], type='json', website=True, auth="public")
    def web_customize_menu_get(self, xml_ids):
        enable = []
        disable = []
        ids = self.get_view_ids(xml_ids)
        for view in request.env['ir.ui.view'].with_context(
                active_test=True).browse(ids):
            if view.active:
                enable.append(view.xml_id)
            else:
                disable.append(view.xml_id)
        return [enable, disable]

    def _get_customize_views(self, xml_ids):
        View = request.env["ir.ui.view"].with_context(active_test=False)
        if not xml_ids:
            return View
        domain = [("key", "in", xml_ids)]
        return View.search(domain)
    
    @http.route(['/web/web_customize_menu'], type='json', auth="user")
    def web_customize_menu(self, enable, disable, get_bundle=False):
        print("@@@@@@@@@@@@@@",disable,enable)
        self._get_customize_views(disable).write({'active': False})
        self._get_customize_views(enable).write({'active': True})
        if get_bundle:
            context = dict(request.context)
            return {
                'web.assets_common': request.env["ir.qweb"].sudo()._get_asset_link_urls(
                    'web.assets_common', options=context),
                'web.assets_backend': request.env[
                    "ir.qweb"].sudo()._get_asset_link_urls(
                    'web.assets_backend', options=context),
                # 'web_editor.assets_wysiwyg': request.env["ir.qweb"].sudo()._get_asset_link_urls(
                #     'web_editor.assets_wysiwyg', options=context)
            }

        return True
