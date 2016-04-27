# -*- coding: utf-8 -*-
"""
Copyright (c) Microsoft Open Technologies (Shanghai) Co. Ltd.  All rights reserved.

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""

__author__ = 'rapidhere'

import json
import base64

from azure.servicemanagement import WindowsConfigurationSet, LinuxConfigurationSet, OSVirtualHardDisk, \
    ResourceExtensionReference, ResourceExtensionParameterValue
from threading import current_thread
from hackathon import RequiredFeature
from hackathon.constants import VE_PROVIDER
from template_constants import AZURE_UNIT
from template_unit import TemplateUnit


class AzureTemplateUnit(TemplateUnit):
    util = RequiredFeature("util")
    # other constants
    BLOB_BASE = '%s-%s-%s-%s-%s-%s-%s-%s.vhd'
    MEDIA_BASE = 'https://%s.%s/%s/%s'

    def __init__(self, virtual_environment):
        super(AzureTemplateUnit, self).__init__(VE_PROVIDER.AZURE)
        #self.virtual_environment = virtual_environment
        
        self.virtual_environment = load_default_config()
        for key, value in virtual_environment.iteritems():
            self.virtual_environment[key] = value


    def load_default_config(self):
        dic = {
            AZURE_UNIT.CONTAINER: "vhds",
            AZURE_UNIT.ROLE_SIZE: "Small",
            AZURE_UNIT.CLOUD_SERVICE: { 
                AZURE_UNIT.CLOUD_SERVICE_SERVICE_NAME: "ohp-win2016", 
                AZURE_UNIT.CLOUD_SERVICE_LOCATION: "China East", 
                AZURE_UNIT.CLOUD_SERVICE_LABEL: "ohp-win2016" 
            },
            AZURE_UNIT.IMAGE: { 
                AZURE_UNIT.IMAGE_TYPE: "os",
                AZURE_UNIT.IMAGE_NAME: "55bc2b193643443bb879a78bda516fc8__WindowsServerCore_en-us_TP4_Container_Azure-20151118.vhd" 
            },
            AZURE_UNIT.REMOTE_PROVIDER: "1",
            AZURE_UNIT.LABEL: "ohp-win2016",
            AZURE_UNIT.SYSTEM_CONFIG: {
                AZURE_UNIT.SYSTEM_CONFIG_USER_NAME: "opentech",
                AZURE_UNIT.SYSTEM_CONFIG_USER_PASSWORD: "Password01!",
                AZURE_UNIT.SYSTEM_CONFIG_OS_FAMILY: "Windows",
                AZURE_UNIT.SYSTEM_CONFIG_HOST_NAME: "hostname"
            },
            AZURE_UNIT.ROLE_NAME: "ohp-win2016",
            AZURE_UNIT.DEPLOYMENT: {
                AZURE_UNIT.DEPLOYMENT_DEPLOYMENT_SLOT: "production",
                AZURE_UNIT.DEPLOYMENT_DEPLOYMENT_NAME: "ohp-win2016"
            },
            AZURE_UNIT.STORAGE_ACCOUNT: {
                AZURE_UNIT.STORAGE_ACCOUNT_SERVICE_NAME: "ohpvhds",
                AZURE_UNIT.STORAGE_ACCOUNT_LOCATION: "China East",
                AZURE_UNIT.STORAGE_ACCOUNT_URL_BASE: "blob.core.chinacloudapi.cn",
                AZURE_UNIT.STORAGE_ACCOUNT_DESCRIPTION: "storage-description",
                AZURE_UNIT.STORAGE_ACCOUNT_LABEL: "storage-label"
            },
            AZURE_UNIT.REMOTE: {
                AZURE_UNIT.REMOTE_INPUT_ENDPOINT_NAME: "remote",
                AZURE_UNIT.REMOTE_PROTOCOL: "rdp",
                AZURE_UNIT.REMOTE_PROVIDER: "guacamole"
            },
            AZURE_UNIT.NETWORK_CONFIG: {
                AZURE_UNIT.NETWORK_CONFIG_INPUT_ENDPOINTS: [{
                    AZURE_UNIT.NETWORK_CONFIG_INPUT_ENDPOINTS_URL: "http://{0}:{1}",
                    AZURE_UNIT.NETWORK_CONFIG_INPUT_ENDPOINTS_PROTOCOL: "tcp",
                    AZURE_UNIT.NETWORK_CONFIG_INPUT_ENDPOINTS_NAME: "http",
                    AZURE_UNIT.NETWORK_CONFIG_INPUT_ENDPOINTS_LOCAL_PORT: "80"
                }, {
                    AZURE_UNIT.NETWORK_CONFIG_INPUT_ENDPOINTS_PROTOCOL: "tcp",
                    AZURE_UNIT.NETWORK_CONFIG_INPUT_ENDPOINTS_NAME: "remote",
                    AZURE_UNIT.NETWORK_CONFIG_INPUT_ENDPOINTS_LOCAL_PORT: "3389"
                }],
                AZURE_UNIT.NETWORK_CONFIG_CONFIGURATION_SET_TYPE: "NetworkConfiguration"
            }
        }

        return dic

    def get_name(self):
        return "TODO: name"

    def get_type(self):
        return "TODO: type"

    def get_description(self):
        return "TODO: description"

    def get_image_type(self):
        return self.virtual_environment[AZURE_UNIT.IMAGE][AZURE_UNIT.IMAGE_TYPE]

    def is_vm_image(self):
        return self.get_image_type() == AZURE_UNIT.VM

    def get_image_name(self):
        return self.virtual_environment[AZURE_UNIT.IMAGE][AZURE_UNIT.IMAGE_NAME]

    def get_resource_extension_references(self):
        if self.is_vm_image():
            return None

        ext = ResourceExtensionReference(
            AZURE_UNIT.DISABLE_NLA_EXTENSION_REFRENCE.REFRENCE_NAME,
            AZURE_UNIT.DISABLE_NLA_EXTENSION_REFRENCE.PUBLISHER,
            AZURE_UNIT.DISABLE_NLA_EXTENSION_REFRENCE.EXTENSION_NAME,
            AZURE_UNIT.DISABLE_NLA_EXTENSION_REFRENCE.VERSION)

        # construct par value
        par_value = ResourceExtensionParameterValue()
        par_value.key = AZURE_UNIT.RESOUCE_EXTENSION_PUBLIC_KEY
        setting = {
            AZURE_UNIT.DISABLE_NLA_EXTENSION_REFRENCE.CONFIG_KEY_FILE_URIS:
                AZURE_UNIT.DISABLE_NLA_EXTENSION_REFRENCE.FILE_URIS,

            AZURE_UNIT.DISABLE_NLA_EXTENSION_REFRENCE.CONFIG_KEY_RUN:
                AZURE_UNIT.DISABLE_NLA_EXTENSION_REFRENCE.RUN}
        par_value.value = base64.standard_b64encode(json.dumps(setting))
        par_value.type = AZURE_UNIT.RESOUCE_EXTENSION_PUBLIC_TYPE
        ext.resource_extension_parameter_values = [par_value]

        return [ext]

    def get_system_config(self):
        if self.is_vm_image():
            return None

        sc = self.virtual_environment[AZURE_UNIT.SYSTEM_CONFIG]
        # check whether virtual machine is Windows or Linux
        if sc[AZURE_UNIT.SYSTEM_CONFIG_OS_FAMILY] == AZURE_UNIT.WINDOWS:
            system_config = WindowsConfigurationSet(computer_name=sc[AZURE_UNIT.SYSTEM_CONFIG_HOST_NAME],
                                                    admin_password=sc[AZURE_UNIT.SYSTEM_CONFIG_USER_PASSWORD],
                                                    admin_username=sc[AZURE_UNIT.SYSTEM_CONFIG_USER_NAME])
            system_config.domain_join = None
            system_config.win_rm = None
        else:
            system_config = LinuxConfigurationSet(host_name=sc[AZURE_UNIT.SYSTEM_CONFIG_HOST_NAME],
                                                  user_name=sc[AZURE_UNIT.SYSTEM_CONFIG_USER_NAME],
                                                  user_password=sc[AZURE_UNIT.SYSTEM_CONFIG_USER_PASSWORD],
                                                  disable_ssh_password_authentication=False)
        return system_config

    def get_raw_system_config(self):
        """return raw, unprocessed system config from json
        """
        return self.virtual_environment[AZURE_UNIT.SYSTEM_CONFIG]

    def get_os_virtual_hard_disk(self):
        if self.is_vm_image():
            return None

        i = self.virtual_environment[AZURE_UNIT.IMAGE]
        sa = self.virtual_environment[AZURE_UNIT.STORAGE_ACCOUNT]
        c = self.virtual_environment[AZURE_UNIT.CONTAINER]
        now = self.util.get_now()
        blob = self.BLOB_BASE % (i[AZURE_UNIT.IMAGE_NAME],
                                 str(now.year),
                                 str(now.month),
                                 str(now.day),
                                 str(now.hour),
                                 str(now.minute),
                                 str(now.second),
                                 str(current_thread().ident))
        media_link = self.MEDIA_BASE % (sa[AZURE_UNIT.STORAGE_ACCOUNT_SERVICE_NAME],
                                        sa[AZURE_UNIT.STORAGE_ACCOUNT_URL_BASE],
                                        c,
                                        blob)
        os_virtual_hard_disk = OSVirtualHardDisk(i[AZURE_UNIT.IMAGE_NAME], media_link)
        return os_virtual_hard_disk

    def get_raw_network_config(self):
        """raw, unprocessed network configs
        """
        return self.virtual_environment[AZURE_UNIT.NETWORK_CONFIG]

    def get_storage_account_name(self):
        return self.virtual_environment[AZURE_UNIT.STORAGE_ACCOUNT][AZURE_UNIT.STORAGE_ACCOUNT_SERVICE_NAME]

    def get_storage_account_description(self):
        return self.virtual_environment[AZURE_UNIT.STORAGE_ACCOUNT][AZURE_UNIT.STORAGE_ACCOUNT_DESCRIPTION]

    def get_storage_account_label(self):
        return self.virtual_environment[AZURE_UNIT.STORAGE_ACCOUNT][AZURE_UNIT.STORAGE_ACCOUNT_LABEL]

    def get_storage_account_location(self):
        return self.virtual_environment[AZURE_UNIT.STORAGE_ACCOUNT][AZURE_UNIT.STORAGE_ACCOUNT_LOCATION]

    def get_cloud_service_name(self):
        return self.virtual_environment[AZURE_UNIT.CLOUD_SERVICE][AZURE_UNIT.CLOUD_SERVICE_SERVICE_NAME]

    def get_cloud_service_label(self):
        return self.virtual_environment[AZURE_UNIT.CLOUD_SERVICE][AZURE_UNIT.CLOUD_SERVICE_LABEL]

    def get_cloud_service_location(self):
        return self.virtual_environment[AZURE_UNIT.CLOUD_SERVICE][AZURE_UNIT.CLOUD_SERVICE_LOCATION]

    def get_deployment_slot(self):
        return self.virtual_environment[AZURE_UNIT.DEPLOYMENT][AZURE_UNIT.DEPLOYMENT_DEPLOYMENT_SLOT]

    def get_deployment_name(self):
        return self.virtual_environment[AZURE_UNIT.DEPLOYMENT][AZURE_UNIT.DEPLOYMENT_DEPLOYMENT_NAME]

    def get_virtual_machine_name(self):
        return self.virtual_environment[AZURE_UNIT.ROLE_NAME]

    def get_virtual_machine_label(self):
        return self.virtual_environment[AZURE_UNIT.LABEL]

    def get_virtual_machine_size(self):
        if self.is_vm_image():
            return None

        return self.virtual_environment[AZURE_UNIT.ROLE_SIZE]

    def get_remote_provider_name(self):
        return self.virtual_environment[AZURE_UNIT.REMOTE][AZURE_UNIT.REMTOE_PROVIDER]

    def get_remote_port_name(self):
        return self.virtual_environment[AZURE_UNIT.REMOTE][AZURE_UNIT.REMOTE_INPUT_ENDPOINT_NAME]

    def get_remote(self):
        return self.virtual_environment[AZURE_UNIT.REMOTE]
