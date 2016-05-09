/*
 * Copyright (c) Microsoft Open Technologies (Shanghai) Co. Ltd.  All rights reserved.
 *
 * The MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function($, oh) {

    // true: PUT to update; false: POST to create
    var is_update = false;


    // clear template form after create/update template
    function clearTemplateForm(){
        $('[data-type="temp-unit-list"]').empty();
        var form = $('#templateform');
        form[0].reset();
        form.data('bootstrapValidator').resetForm(true);
    }

    // add bootstrap validator when create template unit form and create port form dynamically
    function addFieldValidate(element){
         $(element).find('[data-validate="true"]').each(function(i,input){
            $('#templateform').bootstrapValidator('addField',$(input));
         })
    }

    //docker

    // create template unit form dynamically
    // data is None: create; empty form
    // data is not None: update; fill data to form
    function createTemplateUnitDocker(data){
        var templist= $('[data-type="temp-unit-list"]');
        var template_unit = $($('#template_unit_item_docker').html());
        if(data){
            template_unit.find('[name="name"]').val(data['name']);
            template_unit.find('[name="type"]').val(data['type']);
            template_unit.find('[name="provider"]').val(data['provider']);
            template_unit.find('[name="description"]').val(data['description']);
            template_unit.find('[name="image"]').val(data['Image']);
            template_unit.find('[name="env"]').val(data['Env'].join(";"));
            template_unit.find('[name="cmd"]').val(data['Cmd'].join(" "));
            for(var i = 0; i < data['ports'].length; i++)
                if(data['ports'][i]['port'] == data['remote']['port']){
                    template_unit.find('[name="remote-name"]').val(data['ports'][i]['name']);
                    break;
                }
            template_unit.find('[name="remote-provider"]').val(data['remote']['provider']);
            template_unit.find('[name="remote-protocol"]').val(data['remote']['protocol']);
            template_unit.find('[name="remote-port"]').val(data['remote']['port']);
            template_unit.find('[name="remote-username"]').val(data['remote']['username']);
            template_unit.find('[name="remote-password"]').val(data['remote']['password']);
            for(var i = 0; i < data['ports'].length; i++)
                if(data['ports'][i]['port'] != data['remote']['port'])
                    createPort(template_unit.find('[data-type="port-list"]'), data['ports'][i]);
        }
        template_unit.appendTo(templist);
        addFieldValidate(template_unit);
        return template_unit;
    }

    // compose PUT/POST data for back end api
    function getFormDataDocker(){
        var data = [];
        $('[data-type="template-unit-group"]').each(function(i,group){
            var $group = $(group);
            var remote = {
                provider: $group.find('[name="remote-provider"]').val(),
                protocol: $group.find('[name="remote-protocol"]').val(),
                username: $group.find('[name="remote-username"]').val(),
                password: $group.find('[name="remote-password"]').val(),
                port: Number($group.find('[name="remote-port"]').val())
            }
            var ports = []
            ports.push({
                name: $group.find('[name="remote-name"]').val(),
                port: remote['port'],
                public: true,
                protocol: 'tcp'
            })
            $group.find('[data-type="port-group"]').each(function(i,portgroup){
                var $portgroup = $(portgroup);
                var port = {
                    name: $portgroup.find('[name="name"]').val(),
                    port: Number($portgroup.find('[name="port"]').val()),
                    public: Boolean($portgroup.find('[name="public"]').val()),
                    protocol: $portgroup.find('[name="protocol"]').val()
                }
                if($portgroup.find('[name="url-protocol"]').val().length > 0)
                    port['url'] = $portgroup.find('[name="url-protocol"]').val() + '://{0}:{1}/' + $portgroup.find('[name="url-path"]').val()
                ports.push(port)
            })
            data.push({
                name: $group.find('[name="name"]').val(),
                type: $group.find('[name="type"]').val(),
                provider: $group.find('[name="provider"]').val(),
                description: $group.find('[name="description"]').val(),
                ports: ports,
                remote: remote,
                Image: $group.find('[name="image"]').val(),
                Env: removeEmptyString($group.find('[name="env"]').val().split(";")),
                Cmd: removeEmptyString($group.find('[name="cmd"]').val().split(" "))
            })
        })
        return {
            name: $('#name').val(),
            description: $('#description').val(),
            virtual_environments: data
        };
    }

    // fill data to form
    function setFormDataDocker(item){
        data = item['data']
        $('#name').val(data['expr_name']).attr({disabled:'disabled'});
        $('#description').val(data['description']);
        $('#provider').val(item['provider']).attr({disabled:'disabled'});
        data['virtual_environments'].forEach(createTemplateUnitDocker);
    }


    //azure
    function createTemplateUnitAzure(data){
        var templist= $('[data-type="temp-unit-list"]');
        var template_unit = $($('#template_unit_item_azure').html());
        // if(data){
        //     template_unit.find('[name="name"]').val(data['name']);
        //     template_unit.find('[name="type"]').val(data['type']);
        //     template_unit.find('[name="provider"]').val(data['provider']);
        //     template_unit.find('[name="description"]').val(data['description']);
        //     template_unit.find('[name="image"]').val(data['Image']);
        //     template_unit.find('[name="env"]').val(data['Env'].join(";"));
        //     template_unit.find('[name="cmd"]').val(data['Cmd'].join(" "));
        //     for(var i = 0; i < data['ports'].length; i++)
        //         if(data['ports'][i]['port'] == data['remote']['port']){
        //             template_unit.find('[name="remote-name"]').val(data['ports'][i]['name']);
        //             break;
        //         }
        //     template_unit.find('[name="remote-provider"]').val(data['remote']['provider']);
        //     template_unit.find('[name="remote-protocol"]').val(data['remote']['protocol']);
        //     template_unit.find('[name="remote-port"]').val(data['remote']['port']);
        //     template_unit.find('[name="remote-username"]').val(data['remote']['username']);
        //     template_unit.find('[name="remote-password"]').val(data['remote']['password']);
        //     for(var i = 0; i < data['ports'].length; i++)
        //         if(data['ports'][i]['port'] != data['remote']['port'])
        //             createPort(template_unit.find('[data-type="port-list"]'), data['ports'][i]);
        // }
        template_unit.appendTo(templist);
        addFieldValidate(template_unit);
        return template_unit;
    }

    // compose PUT/POST data for back end api
    function getFormDataAzure(){
        var data = [];
        $('[data-type="template-unit-group"]').each(function(i,group){
            var $group = $(group);
            var role_size = $group.find('[name="role_size"]').val();
            var service_name = $group.find('[name="service_name"]').val();
            var location = $group.find('[name="location"]').val(); //two aspects

            var cloud_service = {
                service_name: service_name,
                location: location,
                label: service_name
            };

            var image = {
                type: $group.find('[name="image-type"]').val(),
                name: $group.find('[name="image-name"]').val()
            };

            var system_config = {
                user_name: $group.find('[name="system_config-user_name"]').val(),
                user_password: $group.find('[name="system_config-user_password"]').val(),
                os_family: $group.find('[name="system_config-os_family"]').val(),
                hostname: $group.find('[name="system_config-hostname"]').val()
            };

            var deployment = {
                deployment_slot: "production",
                deployment_name: service_name
            };

            var storage_account = {
                service_name: "ohpvhds", //or use service_name
                location: location,
                url_base: "blob.core.chinacloudapi.cn",
                description: "storage-description",
                label: "storage-label"
            }

            var remote = {
                input_endpoint_name: "remote",
                provider: $group.find('[name="remote-provider"]').val(),
                protocol: $group.find('[name="remote-protocol"]').val()
            };

            //TODO remove hardcode
            var network_config = {
                input_endpoint_name: [
                    {
                        url: "http://{0}:{1}",
                        protocol: "tcp",
                        name: "http",
                        local_port: 80
                    }, {
                        protocol: "tcp",
                        name: "remote",
                        local_port: 3389
                    }
                ],
                configuration_set_type: "NetworkConfiguration"
            };


            // var ports = []
            // ports.push({
            //     name: $group.find('[name="remote-name"]').val(),
            //     port: remote['port'],
            //     public: true,
            //     protocol: 'tcp'
            // })
            // $group.find('[data-type="port-group"]').each(function(i,portgroup){
            //     var $portgroup = $(portgroup);
            //     var port = {
            //         name: $portgroup.find('[name="name"]').val(),
            //         port: Number($portgroup.find('[name="port"]').val()),
            //         public: Boolean($portgroup.find('[name="public"]').val()),
            //         protocol: $portgroup.find('[name="protocol"]').val()
            //     }
            //     if($portgroup.find('[name="url-protocol"]').val().length > 0)
            //         port['url'] = $portgroup.find('[name="url-protocol"]').val() + '://{0}:{1}/' + $portgroup.find('[name="url-path"]').val()
            //     ports.push(port)
            // })
            data.push({
                provider: $group.find('[name="provider"]').val(),
                role_size: $group.find('[name="role_size"]').val(),
                cloud_service: cloud_service,
                image: image,
                label: service_name,
                role_name: service_name,
                system_config: system_config,
                deployment: deployment,
                storage_account: storage_account,
                remote: remote,
                network_config: network_config
            })
        });

        return {
            name: $('#name').val(),
            description: $('#description').val(),
            virtual_environments: data
        };
    }

    // fill data to form
    function setFormDataAzure(item){
        data = item['data']
        $('#name').val(data['expr_name']).attr({disabled:'disabled'});
        $('#description').val(data['description']);
        $('#provider').val(item['provider']).attr({disabled:'disabled'});
        data['virtual_environments'].forEach(createTemplateUnitDocker);
    }

    // create port form dynamically
    // data is None: create; empty form
    // data is not None: update; fill data to form
    function createPort(element, data){
        var portlist= $(element).parents('[data-type="template-unit-group"]').find('[data-type="port-list"]');
        var port = $($('#port_item').html());
        if(data){
            port.find('[name="name"]').val(data['name']);
            port.find('[name="port"]').val(data['port']);
            port.find('[name="public"]').val(data['public']);
            port.find('[name="protocol"]').val(data['protocol']);
            if('url' in data){
                var url_protocol = data['url'].substring(0, data['url'].indexOf(":"));
                port.find('[name="url-protocol"]').val(url_protocol);
                var url_path = data['url'].substring(data['url'].lastIndexOf("/") + 1, data['url'].length);
                port.find('[name="url-path"]').val(url_path);
            }
        }
        port.appendTo(portlist);
        addFieldValidate(port);
        return port;
    }

    // delete port form dynamically
    function deletePort(element, data){
        $(element).parents('[data-type="port-group"]').detach();
    }

    // remove empty string produced by split
    function removeEmptyString(data){
        var ans = [];
        for(var i = 0; i < data.length; i++)
            if(data[i] != '')
                ans.push(data[i]);
        return ans;
    }


    // PUT to update
    function updateTemplate(data){
        return oh.api.template.put({
            body: data,
            header: {hackathon_name:currentHackathon}
        }, function(data){
            if(data.error){
                alert(data.error.message);
            }else{
            }
        })
    }


    // POST to create
    function createTemplate(data){
        return oh.api.template.post({
            body: data
        }, function(data){
            if(data.error){
                alert(data.error.message);
            }else{
            }
        })
    }


    function getFormData() {
        // TODO: check different data
        // return getFormDataDocker();
        return getFormDataAzure();
    }

    // delete template unit form dynamically
    function deleteTemplateUnit(element, data){
        $(element).parents('[data-type="template-unit-group"]').detach();
    }

    function init(){
        var templateform = $('#templateform');
        templateform.bootstrapValidator().on('success.form.bv', function(e) {
            e.preventDefault();
            var formData = getFormData();
            (is_update ? updateTemplate(formData) : createTemplate(formData)).then(function(){
                if(is_update)
                    is_update = false;
                location.href = "/template";
            })
        });

        //add or delete port(docker or azure)
        templateform.on('click','[data-type="btn_add_port"]',function(e){
            createPort(this);
        });

        templateform.on('click','[data-type="btn_delete_port"]',function(e){
            deletePort(this);
        });

        //add docker template
        var add_template_unit_docker = $('#btn_add_template_unit_docker').click(function(e){
            createTemplateUnitDocker();
        });

        //add azure template
        var add_template_unit_azure= $('#btn_add_template_unit_azure').click(function(e){
            createTemplateUnitAzure();
        });

        //delete current template(docker or azure)
        templateform.on('click','[data-type="btn_delete_template_unit"]',function(e){
            deleteTemplateUnit(this);
        });

        // $('[data-type="template_item_add"]').click(function(e){
        //     $('#name').removeAttr('disabled');
        //     $('#provider').removeAttr('disabled');
        //     createTemplateUnitDocker();
        // });

    }

    $(function() {
        init();
        // createTemplateUnitDocker();
    })

})(window.jQuery,window.oh);