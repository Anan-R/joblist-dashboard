var socket = io();
$(function(){
    $('.dpicker').datepicker({ dateFormat: 'dd.mm.yy' });
    $('#collapse-close').click(function(){
        $('body').removeClass('collapsed');
        localStorage.setItem('collapsed', '');
    });

    $('#collapse-open').click(function(){
        $('body').addClass('collapsed');
        localStorage.setItem('collapsed', 'collapsed');
    });

    // setTimeout(function(){
    //     $(document.body).addClass(localStorage.getItem("collapsed"));
    // }, 5000); 

    $('#newProcess').click(function(){
        var pName = $('#inputProcess').val();
        if (pName) {
            $.ajax({
                url: "/process", 
                type: "POST",
                data: {name: pName},
                dataType: "json",
                success: function(result){
                    console.log('process', 'add', result);
                    initProcess(result);
                    initSortable();
                    $('#inputProcess').val('');
                    socket.emit('update-process');
                }, error: function(err, status) {
                    console.log(err, status);
                }
            });
        }
    });

    function initSortable() {
        $( "#processList" ).sortable({
            placeholder: "highlight",
            update: function(event, ui) {
                var ids = $(this).sortable('toArray').toString();
                console.log('ids', ids);
                $.ajax({
                    url: "/process", 
                    type: "PUT",
                    data: {ids: ids},
                    dataType: "json",
                    success: function(result){
                        console.log('process', 'update', result);
                        socket.emit('update-process');
                    }, error: function(err, status) {
                        console.log(err, status);
                    }
                });
            }
        });

        $( "#processJob" ).sortable({
            placeholder: "highlight",
            update: function(event, ui) {
                var ids = $(this).sortable('toArray').toString();
                console.log('ids', ids);
                
            }
        });
    }

    function initProcess(arr) {
        $('#processList').empty();
        $('#processJob').empty();
        arr.forEach(function(row){
            $('#processList').append('<li class="px-4 py-2" id="'+row.id+'"><span>'+row.name+'</span><button class="close">&times;</button></li>');
            $('#processJob').append('<li class="px-4 py-2" id="'+row.id+'"><span>'+row.name+'</span><button class="close">&times;</button></li>');
        });
    }

    $('#inputProcess').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $('#newProcess').trigger('click');
        }
    });

    $(document).on('click', '#processList .close', function(){
        var item = $(this).parent().attr('id');
        console.log('delete item', item);
        $.ajax({
            url: "/process?id="+item, 
            type: "DELETE",
            success: function(result){
                console.log('process', 'delete', result);
                initProcess(result);
                initSortable();
                socket.emit('update-process');
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
    });

    $(document).on('click', '#processJob .close', function(){
        $(this).parent().remove();
    });

    $(document).on('click', '#editProcessList .close', function(){
        $(this).parent().remove();
    });

    $('#processModal').on('show.bs.modal', function(e){
        $.ajax({
            url: "/process", 
            type: "GET",
            success: function(result){
                console.log('process', 'get', result);
                initProcess(result);
                initSortable();
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
    });

    $('#newModal').on('show.bs.modal', function(e){
        $.ajax({
            url: "/process", 
            type: "GET",
            success: function(result){
                console.log('process', 'get', result);
                initProcess(result);
                initSortable();
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
    });

    $('#addJob').click(function(){
        var str_picker = $('.dpicker').val();
        if (!str_picker || str_picker.length != 10 || (str_picker.match(/\./g) || []).length != 2) {
            console.log('eee', str_picker.length);
            $.toast({
                heading: 'Error',
                text: 'Ungültiges Datum',
                icon: 'error',
                position: 'bottom-right'
            });
            return;
        }

        var process = [];
        $('#processJob li').each(function(){
            process.push(parseInt($(this).attr('id')));
        });
        var req = $('#newJobForm').serializeArray();
        req.push({name:'process', value:process});

        req.forEach(element => {
            var yourdate = str_picker.split(".").reverse();
            yourdate = yourdate.join("-");
            if (element.name == 'date') element.value = yourdate;
        });

        $.ajax({
            url: "/job", 
            type: "POST",
            data: req,
            dataType: "json",
            success: function(result){
                console.log('job', 'add', result);
                $("#newJobForm")[0].reset();
                $('#newModal').modal('hide');
                $("#dataGrid").dxDataGrid("instance").refresh();
                socket.emit('update-job');
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
    });

    $('#editJob').click(function(){
        var process = [];
        $('#editProcessList li').each(function(){
            process.push(parseInt($(this).attr('id')));
        });
        var req = {
            id:$('#editProcessList').data('process'),
            process: process.join()
        };
        $.ajax({
            url: "/job", 
            type: "PUT",
            data: req,
            success: function(result){
                console.log('job', 'update', result);
                $('#editProcessModal').modal('hide');
                $("#dataGrid").dxDataGrid("instance").refresh();
                socket.emit('update-job');
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
    });

    $('#resetJob').click(function(){
        $.ajax({
            url: "/process", 
            type: "GET",
            success: function(result){
                $('#editProcessList').empty();
                result.forEach(function(row){
                    $('#editProcessList').append('<li class="px-4 py-2" id="'+row.id+'"><span>'+row.name+'</span><button class="close">&times;</button></li>');
                });
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
    });

    $('#print').click(function(){
        var id = $(this).data('print');
        $.ajax({
            url: "/print?id="+id, 
            type: "PUT",
            success: function(result){
                $("#dataGrid").dxDataGrid("instance").refresh();
                socket.emit('update-job');
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
        $("#printContent").print(); // Replace ID with yours
    });

    var dataGrid = $("#dataGrid").dxDataGrid({
        // dataSource: "/job",
        dataSource: new DevExpress.data.CustomStore({
            key: 'id',
            loadMode: "raw",
            load: function() {
                return $.getJSON("/job");
            },
            update: function (key, values) {
                values['id'] = key;
                $.ajax({
                    url: "/job", 
                    type: "PUT",
                    data: values,
                    dataType: "json",
                    success: function(result){
                        console.log('job', 'update', result);
                        socket.emit('update-job');
                    }, error: function(err, status) {
                        console.log(err, status);
                    }
                });
            },
        }),
        showColumnLines: false,
        showRowLines: true,
        rowAlternationEnabled: true,
        showBorders: false,
        wordWrapEnabled: true,
        editing: {
            mode: "cell",
            refreshMode: 'repaint',
            allowUpdating: getCookie("role")=='Guest'?false:true
        },
        sorting: {
            mode: "multiple"
        },
        filterRow: {
            visible: true,
            applyFilter: "auto"
        },
        columns: [
            {
                dataField: "id",
                visible: false,
                sortOrder: "desc"
            },{
                dataField: "method",
                caption: "Methode",
                cssClass: "cell-padding",
                width:120
            },{
                dataField: "order",
                caption: 'Ordner Nr.',
                width:100
            },{
                dataField: "name",
                caption: 'Name',
                width:100
            },{
                dataField: "product",
                caption: 'Produkt',
                width:400
            },{
                dataField: "qty",
                caption: 'Menge',
                width:60
            },{
                dataField: "notes",
                caption: 'Anmerkungen'
            },{
                dataField: "shipping",
                caption: 'Versand',
                width:100
            },{
                dataField: "customs",
                caption: 'Zoll',
                dataType: "boolean",
                width: 80
            },{
                dataField: "initial",
                caption: 'Initial',
                width:50
            },{
                dataField: "process",
                caption: 'Prozess',
                allowEditing: false,
                width:250,
                cellTemplate: function (container, options) {
                    var process = options.data.process;
                    if (process && process.length>0) {
                        process.forEach(function(p, index){
                            $('<span/>').addClass('badge badge-info p-1')
                            .text((index+1)+'. '+p.name)
                            .appendTo(container);
                        });
                        container.on('click', function(){
                            $('#editProcessList').empty();
                            process.forEach(function(p, index){
                                $('#editProcessList').append('<li class="px-4 py-2" id="'+p.id+'"><span>'+p.name+'</span><button class="close">&times;</button></li>');
                            });
                            $('#editProcessList').data('process', options.data.id);
                            $( "#editProcessList" ).sortable({
                                placeholder: "highlight",
                                update: function(event, ui) {
                                    var ids = $(this).sortable('toArray').toString();
                                    console.log('ids', ids);
                                }
                            });
                            $('#editProcessModal').modal('show');
                        });
                    }
                }
            }, {
                dataField: "date",
                caption: 'Datum',
                dataType: "date",
                format: "dd.MM.yyyy",
                width:90
            }, {
                caption: 'Aktion',
                width:100,
                cellTemplate: function (container, options) {
                    $('<a/>').addClass('btn btn-action '+(options.data.print || (options.data.step && options.data.step.length > 0)?'btn-success':'btn-light'))
                        .append('<i class="bi bi-file-earmark-text"></i>')
                        .on('dxclick', function () {
                            $('#barTitle').text("JOB NUMMER: ORD_"+options.data.order);
                            $('#barcodeList').empty();
                            $('#barcodeList').append('<li style="display: -ms-flexbox;display: flex;-ms-flex-wrap: wrap;flex-wrap: wrap;margin-bottom: 20px"><div style="-ms-flex: 0 0 25%;flex: 0 0 25%;max-width: 25%;display: flex;align-items: center;padding-left: 3%;font-size: 20px;width:100%;padding-bottom:20px"></div><div style="-ms-flex: 0 0 37%;flex: 0 0 37%;max-width: 37%;width:100%;text-align:left;font-size: 20px;font-weight: bold">&nbsp;&nbsp;&nbsp;Auftrag Beginn</div><div style="-ms-flex: 0 0 37%;flex: 0 0 37%;max-width: 37%;width:100%;text-align:left;font-size: 20px;font-weight: bold">&nbsp;&nbsp;&nbsp;Auftrag Ende</div></li>');
                            const process = options.data.process;
                            process.forEach(function(step){
                                if (!step) return;
                                $('#barcodeList').append('<li style="display: -ms-flexbox;display: flex;-ms-flex-wrap: wrap;flex-wrap: wrap;"><div style="-ms-flex: 0 0 25%;flex: 0 0 25%;max-width: 25%;display: flex;align-items: center;padding-left: 3%;font-size: 20px;width:100%;padding-bottom:20px">'+step.name+'</div><div style="-ms-flex: 0 0 37%;flex: 0 0 37%;max-width: 37%;width:100%;text-align:left"><svg id="ba1-'+step.id+'"></svg></div><div style="-ms-flex: 0 0 37%;flex: 0 0 37%;max-width: 37%;width:100%;text-align:left"><svg id="ba-'+step.id+'"></svg></div></li>');
                                var id = options.data.id.toString().padStart(6, "0");
                                var st = step.id.toString().padStart(6, "0");
                                var barcode = "1"+id+st;
                                var barcode_start = "2"+id+st;
                                JsBarcode("#ba-"+step.id, barcode, {height: 80, width:2.8});
                                JsBarcode("#ba1-"+step.id, barcode_start, {height: 80, width:2.8});
                            });
                            $('#print').data('print', options.data.id);
                            $('#barcodeModal').modal('show');
                    })
                    .appendTo(container);
                    if (getCookie("role")=='Admin') {
                        $('<a/>').addClass('btn btn-light btn-action ml-1')
                        .append('<i class="bi bi-trash"></i>')
                        .on('dxclick', function () {
                            $.ajax({
                                url: "/job"+"?id="+options.data.id,
                                type: "DELETE",
                                dataType: "json",
                                success: function(result){
                                    $.toast({
                                        heading: 'Success',
                                        text: 'Aktion erfolgreich!',
                                        icon: 'success',
                                        position: 'bottom-right'
                                    });
                                    $("#dataGrid").dxDataGrid("instance").refresh();
                                }, error: function(err, status) {
                                    console.log(err);
                                    if (err.status == 200) {
                                        $.toast({
                                            heading: 'Success',
                                            text: 'Aktion erfolgreich!',
                                            icon: 'success',
                                            position: 'bottom-right'
                                        });
                                        $("#dataGrid").dxDataGrid("instance").refresh();
                                        return;
                                    }
                                    $.toast({
                                        heading: 'Error',
                                        text: 'Aktion: fehlgeschlagen!',
                                        icon: 'error',
                                        position: 'bottom-right'
                                    });
                                }
                            });
                        })
                        .appendTo(container);
                    }
                }
            }
        ],
        onRowPrepared: function(e) {  
            if (e.rowType == "header") e.rowElement.css({ height: 54});  
            else if (e.rowType == 'data') e.rowElement.css({ minHeight: 54});  
        }
    }).dxDataGrid("instance");

    var timeStore;
    var archiveStore;
    var timeGrid;
    var jobGrid;
    var filterProcess = [];
    initTimeGrid();
    function initTimeGrid() {
        $.ajax({
            url: "/job", 
            type: "GET",
            success: function(result){
                var times = [];
                var archives = [];
                result.forEach(function(job){
                    var completed_process_count = 0;
                    var incompleted_process_index = 0;
                    for (var ii=0; ii<job.process.length; ii++) {
                        var deal_process = job.process[ii];
                        if (job.step && job.step.find(s => (s.status === deal_process.name) && !s.start)) completed_process_count ++; 
                        else {
                            incompleted_process_index = ii;
                            break;
                        }  
                    }
                    
                    if (completed_process_count == job.process.length || job.archieved) {
                        var cjob = { ...job };
                        if (job.step && job.step.length > 0) {
                            var i = job.step.length-1;
                            cjob.time = job.step[i].time;
                            cjob.status = job.step[i].status;
                        }
                        archives.push(cjob);
                    } else {
                        var cjob = { ...job };
                        var processes = job.process;
                        var current = job.process[incompleted_process_index];
                        var next = job.process.length > incompleted_process_index+1?job.process[incompleted_process_index+1]:null;
                        if (job.step && job.step.length>0) {
                            var current_index = 0;
                            var current_step = job.step.find(s => (s.status === current.name));
                            cjob.status = current.name;
                            cjob.next = next?next.name:null;
                            if (current_step && current_step.start) {
                                cjob.color = 'success';
                                cjob.time = current_step.time;
                            } else {
                                cjob.color = 'warning';
                                console.log('y', current_index);
                                cjob.time = job.step[job.step.length-1].time;
                            }
                        } else {
                            if (processes.length>0) {
                                cjob.status = processes[0].name;
                                cjob.color = 'warning';
                                if (processes.length>1)cjob.next = processes[1].name;
                            }
                        }
      
                        if (filterProcess.length > 0) {
                            // console.log('xxx', cjob.next, filterProcess, filterProcess.indexOf(cjob.next));
                            if (!((cjob.next && filterProcess.indexOf(cjob.next) >= 0) || filterProcess.indexOf(cjob.status) >=0)) return;
                        }
                        
                        times.push(cjob);
                    }
                });

                console.log('times', times);
      
                timeStore = new DevExpress.data.CustomStore({
                    key: "id",
                    loadMode: "raw",
                    load: function() {
                        return times;
                    },
                    // data: times,
                    update: function (key, values) {
                        values['id'] = key;
                        $.ajax({
                            url: "/job", 
                            type: "PUT",
                            data: values,
                            dataType: "json",
                            success: function(result){
                                console.log('job', 'update', result);
                                socket.emit('update-job');
                            }, error: function(err, status) {
                                console.log(err, status);
                                socket.emit('update-job');
                            }
                        });
                    },
                });
      
                archiveStore = new DevExpress.data.ArrayStore({
                    key: "id",
                    data: archives
                });
            
                timeGrid = $("#timeGrid").dxDataGrid({
                    dataSource: {
                        store: timeStore,
                        reshapeOnPush: true
                    },
                    showColumnLines: false,
                    showRowLines: true,
                    showBorders: false,
                    wordWrapEnabled: true,
                    repaintChangesOnly: true,
                    grouping: {
                        autoExpandAll: true,
                    },
                    editing: {
                        mode: "cell",
                        refreshMode: 'repaint',
                        allowUpdating: getCookie("role")=='Guest'?false:true
                    },
                    columns: [
                        {
                            dataField: "status",
                            caption: 'Prozess',
                            allowEditing: false,
                            cellTemplate: function (container, options) {
                                $('<span/>').addClass('badge badge-'+(options.data.color?options.data.color:'secondary')+' p-2')
                                .text(options.data.status)
                                .appendTo(container);
                            },
                            cssClass: "cell-padding",
                            width:130
                        },{
                            dataField: "time",
                            caption: 'Prozess Zeit',
                            allowEditing: false,
                            dataType: "date",
                            format: "dd.MM.yyyy HH:mm",
                            width:140
                        },{
                            dataField: "next",
                            caption: 'Nächster Prozess',
                            allowEditing: false,
                            cellTemplate: function (container, options) {
                                if (options.data.next)
                                $('<span/>').addClass('badge badge-secondary p-2')
                                .text(options.data.next)
                                .appendTo(container);
                            },
                            width:120
                        },{
                            dataField: "method",
                            caption: "Methode",
                            allowEditing: false,
                            width:120
                        },{
                            dataField: "order",
                            caption: 'Ordner Nr.',
                            allowEditing: false,
                            width:100
                        },{
                            dataField: "name",
                            caption: 'Name',
                            allowEditing: false,
                            width:100
                        },{
                            dataField: "product",
                            caption: 'Produkt',
                            allowEditing: false
                        },{
                            dataField: "qty",
                            caption: 'Menge',
                            allowEditing: false,
                            width:60
                        },{
                            dataField: "notes",
                            caption: 'Anmerkungen'
                        },{
                            dataField: "shipping",
                            caption: 'Versand',
                            allowEditing: false,
                            width:100
                        },{
                            dataField: "customs",
                            caption: 'Zoll',
                            allowEditing: false,
                            dataType: "boolean",
                            width: 80
                        },{
                            dataField: "initial",
                            caption: 'Initial',
                            allowEditing: false,
                            width:50
                        },{
                            dataField: "date",
                            dataType: "date",
                            allowEditing: false,
                            format: "dd.MM.yyyy",
                            caption: 'Versanddatum',
                            visible: false,
                            sortOrder: "asc",
                            groupIndex: 0,
                        }, {
                            caption: 'Aktion',
                            width: 100,
                            cellTemplate: function (container, options) {
                                if (getCookie('role') == 'Admin') {
                                    $('<a/>').addClass('btn btn-light btn-action')
                                    .append('<i class="bi bi-file-earmark-zip"></i>')
                                    .on('dxclick', function () {
                                        var req = {
                                            id:options.data.id,
                                            archieved: true
                                        };
                                        $.ajax({
                                            url: "/job", 
                                            type: "PUT",
                                            data: req,
                                            success: function(result){
                                                $.toast({
                                                    heading: 'Success',
                                                    text: 'Aktion erfolgreich!',
                                                    icon: 'success',
                                                    position: 'bottom-right'
                                                });
                                                initTimeGrid();
                                            }, error: function(err, status) {
                                                console.log(err, status);
                                                $.toast({
                                                    heading: 'Error',
                                                    text: 'Aktion: fehlgeschlagen!',
                                                    icon: 'error',
                                                    position: 'bottom-right'
                                                });
                                            }
                                        });
                                    })
                                    .appendTo(container);
                                }
                            }
                        }
                    ],
                    masterDetail: {
                        enabled: true,
                        template: function(container, options) { 
                            var sData = [];
                            if (options.data.step && options.data.step.length > 0) {
                                options.data.step.forEach(function(s){
                                    if (s.status != options.data.status && !s.start) sData.push(s);
                                });
                            }
                            
                            $("<div>")
                                .dxDataGrid({
                                    columnAutoWidth: true,
                                    showBorders: false,
                                    showColumnLines: false,
                                    showRowLines: true,
                                    rowAlternationEnabled: false,
                                    columns: [
                                        {
                                            dataField: "status",
                                            caption: 'Prozess',
                                            cellTemplate: function (container, options) {
                                                $('<span/>').addClass('badge badge-success p-2')
                                                .text(options.data.status)
                                                .appendTo(container);
                                            },
                                            cssClass: "detail-padding",
                                            width:280
                                        },{
                                            dataField: "time",
                                            caption: 'Prozess Zeit',
                                            dataType: "date",
                                            sortOrder: "desc",
                                            format: "dd.MM.yyyy HH:mm",
                                        }
                                    ],
                                    onRowPrepared: function(e){  
                                        if(e.rowType=="header"){  
                                            e.rowElement.css("display", 'none');  
                                        }
                                    },
                                    dataSource: new DevExpress.data.DataSource({
                                        store: new DevExpress.data.ArrayStore({
                                            key: "status",
                                            data: sData
                                        })
                                    })
                                }).appendTo(container);
                        }
                    },
                    filterRow: {
                        visible: true,
                        applyFilter: "auto"
                    },
                    paging: {
                        enabled: false
                    },
                    onRowPrepared: function(e) {  
                        if (e.rowType == "header") e.rowElement.css({ height: 54});  
                        else if (e.rowType == 'data') {
                            e.rowElement.css({ height: 54});  
                            const exp = new Date(e.data.date);
                            const today = new Date();
                            if (exp.getDate() === today.getDate() && exp.getMonth() === today.getMonth() && exp.getFullYear() == today.getFullYear()) e.rowElement.addClass('bg-light-danger');
                            else if (exp < today) e.rowElement.addClass('bg-danger');
                        }
                    }
                }).dxDataGrid("instance");
      
                jobGrid = $("#jobGrid").dxDataGrid({
                    dataSource: {
                        store: archiveStore,
                        reshapeOnPush: true
                    },
                    showColumnLines: false,
                    showRowLines: true,
                    rowAlternationEnabled: true,
                    showBorders: false,
                    wordWrapEnabled: true,
                    repaintChangesOnly: true,
                    grouping: {
                        autoExpandAll: true,
                    },
                    columns: [
                        {
                            dataField: "status",
                            caption: 'Prozess',
                            cellTemplate: function (container, options) {
                                $('<span/>').addClass('badge badge-success p-2')
                                .text(options.data.status)
                                .appendTo(container);
                            },
                            cssClass: "cell-padding",
                            width:100
                        },{
                            dataField: "time",
                            dataType: "date",
                            format: "dd.MM.yyyy",
                            caption: 'Archiviert bei',
                            groupIndex: 0,
                            sortOrder: "desc",
                            width:140
                        },{
                            dataField: "method",
                            caption: "Methode",
                            width:120
                        },{
                            dataField: "order",
                            caption: 'Ordner Nr.',
                            width:100
                        },{
                            dataField: "name",
                            caption: 'Name',
                            width:100
                        },{
                            dataField: "product",
                            caption: 'Produkt',
                        },{
                            dataField: "qty",
                            caption: 'Menge',
                            width:60
                        },{
                            dataField: "notes",
                            caption: 'Anmerkungen'
                        },{
                            dataField: "shipping",
                            caption: 'Versand',
                            width:100
                        },{
                            dataField: "customs",
                            caption: 'Zoll',
                            dataType: "boolean",
                            width: 80
                        },{
                            dataField: "initial",
                            caption: 'Initial',
                            width:50
                        }
                    ],
                    masterDetail: {
                        enabled: true,
                        template: function(container, options) { 
                            var sData = [];
                            options.data.step.forEach(function(s){
                                if (s.status != options.data.status) sData.push(s);
                            });
      
                            $("<div>")
                                .dxDataGrid({
                                    columnAutoWidth: true,
                                    showBorders: false,
                                    showColumnLines: false,
                                    showRowLines: true,
                                    rowAlternationEnabled: false,
                                    columns: [
                                        {
                                            dataField: "status",
                                            caption: 'Prozess',
                                            cellTemplate: function (container, options) {
                                                $('<span/>').addClass('badge badge-success p-2')
                                                .text(options.data.status)
                                                .appendTo(container);
                                            },
                                            cssClass: "detail-padding",
                                            width:280
                                        },{
                                            dataField: "time",
                                            caption: 'Prozess Zeit',
                                            dataType: "date",
                                            sortOrder: "desc",
                                            format: "dd.MM.yyyy HH:mm",
                                        }
                                    ],
                                    onRowPrepared: function(e){  
                                        if(e.rowType=="header"){  
                                            e.rowElement.css("display", 'none');  
                                        }
                                    },
                                    dataSource: new DevExpress.data.DataSource({
                                        store: new DevExpress.data.ArrayStore({
                                            key: "status",
                                            data: sData
                                        })
                                    })
                                }).appendTo(container);
                        }
                    },
                    filterRow: {
                        visible: true,
                        applyFilter: "auto"
                    },
                    onRowPrepared: function(e) {  
                        if (e.rowType == "header") e.rowElement.css({ height: 54});  
                        else if (e.rowType == 'data') e.rowElement.css({ height: 54});  
                    }
                }).dxDataGrid("instance");
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
    }    

    function initFilter() {
        $.ajax({
            url: "/process", 
            type: "GET",
            success: function(result){
                console.log('process', 'get', result);
                $('#selectFilter').empty();
                result.forEach(function(row){
                    $('#selectFilter').append('<option>'+row.name+'</option>');
                });
                $('#selectFilter').selectpicker('deselectAll');
            }, error: function(err, status) {
                console.log(err, status);
            }
        });
    }

    initFilter();
    $('#selectFilter').change(function(){
        filterProcess = $(this).val();
        initTimeGrid();  
    });

    $(document).on('click', '#dropdownGroup a', function(){
        $('#dropdownGroup a').removeClass('active');
        $(this).addClass('active');
        if ($(this).data('id') == 1) {
            $('#pills-date').removeClass('show active');   
            $('#pills-job').addClass('show active');   
        } else {
            $('#pills-date').addClass('show active');   
            $('#pills-job').removeClass('show active');   
        }

        initTimeGrid();
        initFilter();
    });

    $('#t-send').click(function(){
        socket.emit('scan', $('#t-barcode').val());
    });

    socket.on('scanned', (data)=>{
        console.log('scanned', data);
        if (data.type == 'success') {
            $.toast({
                heading: 'Verarbeitet',
                text: data.step+' - '+data.product,
                icon: 'success',
                position: 'bottom-right'
            });
            initTimeGrid();   
        }
        // timeStore.push([{
        //     type: "insert",
        //     key: order.ProductID,
        //     data: data
        // }]);
    });

    socket.on('updated-job', function () {
        console.log('updated job');
        $.toast({
            heading: 'Information',
            text: 'Jobliste wurde gerade aktualisiert',
            icon: 'info',
            position: 'bottom-right'
        });
        initTimeGrid();
    });

    socket.on('updated-process', function () {
        console.log('updated process');
        $.toast({
            heading: 'Information',
            text: 'Die Prozessliste wurde gerade aktualisiert',
            icon: 'info',
            position: 'bottom-right'
        });
        initFilter();
    });

    if (getCookie('role') != 'Admin') {
        $('.allowAdmin').prop('disabled', true);
    }
    if (getCookie('role') == 'Guest') {
        $('.nallowGuest').prop('disabled', true);
    }
});

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}