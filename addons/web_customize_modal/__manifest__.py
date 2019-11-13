# -*- coding: utf-8 -*-
# Part of Odoo Module Developed by Kinfinity Tech Pvt. Ltd.
# See LICENSE file for full copyright and licensing details.

{
    'name': 'Web Customize Modal',
    "summary": "Web Customize Modal.",
    'version': '13.0.1.0.0',
    'category': 'web',
    "description": """
        This modules offers you customization in the odoo backend theme configuration.
    """,
    'author': 'Kinfinity Tech Pvt. Ltd.',
    'maintainer': 'Kinfinity Tech Pvt. Ltd.',
    'website': 'https://www.kinfinitytech.com',
    'depends': [
        'web'
    ],
    'data': [
        'views/template.xml',
    ],
    'qweb': [
        'static/src/xml/*.xml',
    ],
    'images': [
        'static/description/banner.png'
    ],
    'application': True,
    'installable': True,
    'license': 'LGPL-3',
}
