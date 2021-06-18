window.TinyStory =
{
    version: "1.1.3",
    autosave: false,
    autoload: false,
    autoReturn: true,
    filename: "story.txt",
    functions: {},
    fadeSpeed: 200,
    restartPause: 200,
    options: 0,
    
    currentNode: {},
    data: [],
    index: [],
    vars: {},
    space: undefined,
    
    load: function load()
    {
        $.ajax({
            url: this.filename,
            dataType: "text",
            success: function(data) {
                TinyStory.parse(data);
            },
            error: function(e) {
                $("#error").text("'" + TinyStory.filename + "' not found. Make sure the file is at the specified path.");
            }
        });
    },
    
    parse: function parse(data)
    {
        this.raw = data.split(/\r?\n/);
        this.options = 0;
        
        var lastObj = [];
        
        for (var i = 0; i < this.raw.length; i++)
        {
            var obj = {};
            
            var line = this.raw[i].trim();
            
            if (line.substr(0,2) == "//")
                continue;
            
            if (line.length == 0)
                continue;
            
            obj.id = i;
            obj.indent = this.raw[i].search(/\S/);
            
            if (this.space === undefined && obj.indent > 0)
                this.space = (this.raw[i][0] == " ");
            
            if (this.space)
                obj.indent /= 4;
            
            if (obj.indent != Math.round(obj.indent))
            {
                $("#error").html("Faulty indentation detected on line " + (i+1) + ".<br/>Indentation must be either tab or 4 spaces and can't be mixed.");
                return;
            }
            
            switch (line[0])
            {
                case "*":
                    obj.content = line.substr(1).trim();
                    obj.type = "Option";
                    this.options++;
                    break;
                    
                case ":":
                    obj.content = line.substr(1).trim();
                    obj.type = "Condition";
                    break;
                    
                case "=":
                    obj.content = line.substr(1).trim();
                    obj.type = "Operation";
                    break;
                    
                case ">":
                    obj.content = line.substr(1).trim();
                    obj.type = "Jump";
                    break;
                    
                case "<":
                    obj.content = line.substr(1).trim();
                    obj.type = "Link";
                    break;
                    
                case "!":
                    obj.content = line.substr(1).trim();
                    obj.type = "Function";
                    break;
                    
                case "[":
                    if (line[line.length-1] != "]")
                        throw new Error("Expected ']' at end of line at line " + (i+1));
                    
                    obj.content = line.substr(1, line.length-2).trim();
                    obj.type = "Label";
                    this.index[obj.content] = obj;
                    break;
                
                case "#":
                    var cmd = line.substr(1).trim();
                    var value = cmd.substr(cmd.indexOf(" ")+1).trim();
                    
                    switch (cmd.substr(0, cmd.indexOf(" ")))
                    {
                        case "title":
                            $("title").text(value);
                            $("body").prepend($(document.createElement("div"))
                                             .attr("id", "title")
                                             .text(value));
                            break;
                        
                        case "font":
                            $("head").append($(document.createElement("link"))
                                                .attr("href", "https://fonts.googleapis.com/css2?family=" + value.replace(" ", "+"))
                                                .attr("rel", "stylesheet"));
                            $("body").css("font-family", "'" + value + "', sans-serif")
                            break;
                        
                        case "audio":
                            var loadHandler = function loadHandler(event) {
                                var instance = createjs.Sound.play("bgm", { loop: -1 });
                            }

                            createjs.Sound.alternateExtensions = [ "mp3" ];
                            createjs.Sound.on("fileload", loadHandler, this);
                            createjs.Sound.registerSound(value, "bgm");
                            break;
                        
                        case "bg":
                            var vals = value.split(" ");
                            $("body").css("background-image", "url('" + vals[0] + "')");
                            
                            for (var v = 1; v < vals.length; v++)
                            {
                                switch (vals[v]) {
                                    case "cover":
                                    case "contain":
                                        $("body").css("background-size", vals[v]);
                                        break;

                                    case "no-repeat":
                                    case "repeat":
                                    case "repeat-x":
                                    case "repeat-y":
                                    case "space":
                                    case "round":
                                        $("body").css("background-repeat", vals[v]);
                                        break;
                                        
                                    case "center":
                                    case "bottom":
                                    case "top":
                                    case "left":
                                    case "right":
                                        $("body").css("background-position", vals[v]);
                                        break;
                                }
                            }
                            break;
                        
                        case "css":
                            var vals = value.split(" ");
                            $(vals.shift()).css(vals.shift(), vals.join(vals, " "));
                            break;
                    }
                    
                    continue;
                    break;
                
                default:
                    obj.content = line;
                    obj.type = "Text";
                    break;
            }
            
            obj.children = [];
            
            if (obj.indent == 0)
            {
                this.data.push(obj);
                lastObj[0] = obj;
            }
            else
            {
                lastObj[obj.indent-1].children.push(obj);
                obj.parent = lastObj[obj.indent-1];
                lastObj[obj.indent] = obj;
            }
        }
        
        this.run();
    },
    
    run: function run()
    {
        $("#error").remove();
        
        $("#wrapper").css("opacity", 0);
        $("#wrapper").empty();
        this.vars = {};
        
        if (this.autoload && this.loadGame()) {}
        else
            this.loadNode(this.data);
    },
    
    loadNode: function loadNode(data, keep, optionsOnly)
    {
        if (!keep)
            $("#wrapper").empty();
        
        for (var i = 0; i < data.length; i++)
        {
            var obj = data[i];
            
            switch(obj.type)
            {
                case "Option":
                    $("#wrapper").append($(document.createElement("div"))
                                        .addClass("option")
                                        .text(obj.content)
                                        .click(this.handleClick.bind(this, obj, false, false)));
                    break;
                    
                case "Text":
                    if (optionsOnly)
                        break;
                    
                    $("#wrapper").append($(document.createElement("div"))
                                        .addClass("text")
                                        .text(obj.content));
                    break;
                    
                case "Condition":
                    var variable, value;
                    
                    if (obj.content.indexOf(" ") > -1)
                    {
                        variable = obj.content.substr(0, obj.content.indexOf(" "));
                        value = obj.content.substr(obj.content.indexOf(" ")+1);
                    
                        switch (value)
                        {
                            case "undefined":
                                value = undefined;
                                break;
                            case "null":
                                value = null;
                            case "NaN":
                                value = NaN;
                        }
                    }
                    else
                    {
                        variable = obj.content;
                        value = undefined;
                    }
                    
                    if (this.vars[variable] == value)
                    {
                        if (obj.children.length > 0)
                            this.delayedLoadNode(obj.children, true, false);
                        else
                            throw new Error("Empty condition at line " + (i+1));
                    }
                    break;
                    
                case "Operation":
                    var variable, value;
                    
                    if (obj.content.indexOf(" ") > -1)
                    {
                        var variable = obj.content.substr(0, obj.content.indexOf(" "));
                        var value = obj.content.substr(obj.content.indexOf(" ")+1);

                        switch (value)
                        {
                            case "undefined":
                                value = undefined;
                                break;
                            case "null":
                                value = null;
                            case "NaN":
                                value = NaN;
                        }
                    }
                    else
                    {
                        variable = obj.content;
                        value = undefined;
                    }
                    
                    this.vars[variable] = value;
                    break;
                    
                case "Jump":
                    if (obj.content.toLowerCase() == "end")
                    {
                        return;
                    }
                    else if (obj.content.toLowerCase() == "restart")
                    {
                        this.displayRestart();
                        break;
                    }
                    else if (this.index[obj.content] == undefined)
                        console.error("Index '" + obj.content + "' not found");
                    else
                    {
                        this.currentNode = this.index[obj.content].children;
                        this.delayedLoadNode(this.index[obj.content].children, false, false);
                    }
                    break;
                    
                case "Link":
                    if (obj.content.toLowerCase() == "end")
                    {
                        return;
                    }
                    else if (obj.content.toLowerCase() == "restart")
                    {
                        this.displayRestart();
                        break;
                    }
                    else if (this.index[obj.content] == undefined)
                        console.error("Index '" + obj.content + "' not found");
                    else
                        this.delayedLoadNode(this.index[obj.content].children, true, false);
                    break;
                    
                case "Function":
                    if (obj.content.length > 0)
                    {
                        if (typeof this.functions[obj.content] == "function")
                            this.functions[obj.content].call();
                        else
                            console.error("Function '" + obj.content + "' not defined at line " + (i+1));
                            
                    }
                    else
                        console.warn("Empty function at line " + (i+1));
                    break;
                
                case "Label":
                    if (obj.children.length > 0)
                        this.delayedLoadNode(obj.children, true, optionsOnly);
                    else
                        console.warn("Empty label at line " + (i+1));
                    break;
            }
        }
        
        if ($(".option").length == 0 && this.autoReturn && this.options > 0)
            this.moveUp(obj);
        
        $("#wrapper").animate({ opacity: 1 }, this.fadeSpeed);
    },
    
    delayedLoadNode: function(data, keep, optionsOnly)
    {
        if ($("#wrapper").css("opacity") > 0)
            $("#wrapper").animate({ opacity: 0 }, this.fadeSpeed, function() {
                this.loadNode(data, keep, optionsOnly);
            }.bind(this));
        else
            this.loadNode(data, keep, optionsOnly);
    },
    
    handleClick: function handleClick(data, keep, optionsOnly)
    {
        if (this.autoSave)
            this.saveGame();
        
        this.currentNode = data;
        
        this.delayedLoadNode(data.children, keep, optionsOnly);
    },
    
    displayRestart: function displayRestart()
    {
        $("#wrapper").append($(document.createElement("div"))
                                        .addClass("option restart")
                                        .text("Restart")
                                        .click(this.restart.bind(this)));
    },
    
    moveUp: function moveUp(node)
    {
        if (node.indent < 2)
            this.delayedLoadNode(this.data, true, true);
        else
        {
            var topReached = false;
            node = node.parent;
            
            while (node.parent && node.parent.type == "Condition")
            {
                node = node.parent;
                
                if (node.indent == 0)
                    topReached = true;
            }
            
            if (topReached)
                this.delayedLoadNode(this.data, true, true);
            else
                this.delayedLoadNode(node.parent.children, true, true);
        }
    },
    
    restart: function restart()
    {
        if ($("#wrapper").css("opacity") > 0)
            $("#wrapper").animate({ opacity: 0 }, this.fadeSpeed, function() {
                setTimeout(this.run.bind(this), this.restartPause);
            }.bind(this));
        else
            this.run();
    },
    
    saveGame: function saveGame()
    {
        window.localStorage.setItem("ts-savedata", JSON.stringify({
            vars: this.vars,
            id: this.currentNode.id
        }));
    },
    
    loadGame: function loadGame()
    {
        var sd;
        
        if (window.localStorage.getItem("ts-savedata") && (sd = JSON.parse(window.localStorage.getItem("ts-savedata"))))
        {
            if (!sd.vars || !sd.id)
                return false;
            
            this.vars = sd.vars;
            var obj = this.findObjById({ id: -1, children: this.data }, sd.id);
            
            if (!obj)
                return false;
            else 
            {
                this.loadNode(obj.children);
                return true;
            }
        }
        else
            return false;
    },
    
    findObjById: function findObjById(obj, id)
    {
        if (obj.id == id)
            return obj;
        else if (obj.children)
        {
            var result = null;
            for (var i = 0; result == null && i < obj.children.length; i++)
                result = this.findObjById(obj.children[i], id);
            return result;
        }
        
        return null;
    }
}