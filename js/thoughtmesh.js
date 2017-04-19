/**
 * @requires bootbox
 */
(function($) {

    var defaults = {
        'namespace': 'thoughtmesh',
        'platform':'wordpress',
        'render':true,
        'buildInternal':false,
        'externalTags':[],
        'skip_words': ['nbsp', 'is', 'through', 'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us']
    };
    
    var strip_tags = function(input, allowed) { // http://locutus.io/php/strings/strip_tags/
        allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
        return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1) {
            return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
        });
    }


    /*
     *   Globally visible function called by implementing DOM element.
     *   Platform (WP, Scalar, etc.) selection designated by options.platform (Scalar is default)
     */
    $.fn.thoughtmesh = function(options) {
        var $this = $(this);
        var opts = $.extend({}, defaults, options);
        if(opts.platform == 'scalar') {
            //Pulls defaults for book and page of interest from hidden data on page
            if ('undefined' == typeof(opts.book_id)) {
                opts.book_id = ($('link#book_id').length) ? parseInt($('link#book_id').attr('href')) : 0;
            };
            if ('undefined' == typeof(opts.page_id)) {
                var urn = $('link#urn').attr('href');
                opts.page_id = ($('link#urn').length) ? parseInt(urn.substr(urn.lastIndexOf(':')+1)) : 0;
            };
        } else {
            opts.book_id = Math.floor(Math.random()*1000)+1;
        }
        // List excerpts here and there based on a tag
        var tagModal = function() {
            var $this = $(this);
            var tag = $this.data('tm-tag');
            var obj = JSON.parse(localStorage[opts.namespace]);
            // !!! Not used currently?
            // !!! scalar specific
            // var version_urn = $('link#urn').attr('href');
            // var version_id = parseInt(version_urn.substr(version_urn.lastIndexOf(':') + 1));
            bootbox.dialog({
                size: 'large',
                message: '<div id="bootbox-thoughtmesh-content" class="heading_font"></div>',
                title: 'ThoughtMesh pages related to ' + tag,
                className: 'thoughtmesh_bootbox',
                animate: ((navigator.userAgent.match(/(iPod|iPhone|iPad)/)) ? false : true) // Panel is unclickable if true for iOS
            });
            var $box = $('.thoughtmesh_bootbox');
            var $content = $box.find('#bootbox-thoughtmesh-content');
            $content.append('<h5>Loading...</h5>');
            $box.find('.modal-body').height(parseInt($(window).height()) * 0.83);
            $box.find('.bootbox-close-button').empty();
            $box.find('.modal-title').addClass('heading_font');
            // !!! What are document_id and group_id for?
            var document_id = 455; // Temp
            var group_id = 0;
            // !!! separate this call from actual HTML generation?
            $.getScript('http://thoughtmesh.net/export/outsideLexias.json.php?tag=' + encodeURIComponent(tag) + '&documentid=' + document_id + '&groupid=' + group_id + '&external=1&time=' + $.now(), function() {
                outsideLexiasFun();
                if ('undefined' == typeof(outsideLexiasObj)) {
                    alert('Something went wrong attempting to get tag information from ThoughtMesh. Please try again');
                    return false;
                }
                $content.empty();
                var $container = $('<div />').addClass('container-fluid').appendTo($content);
                var $tabs = $('<ul class="nav nav-tabs" role="tablist"><li role="presentation" class="active"><a href="#out" aria-controls="out" role="tab" data-toggle="tab">Excerpts out</a></li><li role="presentation"><a href="#here" aria-controls="here" role="tab" data-toggle="tab">Excerpts here</a></li></ul>').appendTo($container);
                var $tab_content = $('<div class="tab-content"><div role="tabpanel" class="tab-pane active" id="out"></div><div role="tabpanel" class="tab-pane" id="here"></div></div>').appendTo($container);

                if(opts.buildInternal) {
                    // builds table of data from text internal to the platform related to tag
                    var $internal = $('<div />').addClass('row').appendTo($tab_content.find('div:last'));
                    for (var j in obj.internal) {
                        var lexias = {};
                        for (var k in obj.internal[j].lexias) {
                            if (-1 == obj.internal[j].lexias[k].tags.indexOf(tag)) continue;
                            lexias[k] = obj.internal[j].lexias[k];
                        };
                        if ($.isEmptyObject(lexias)) continue;
                        $('<div></div>').appendTo($internal).html(obj.internal[j].author + ',&nbsp;"<a href="' + obj.internal[j].url + '" target="_blank">' + obj.internal[j].title + '</a>"').addClass('col-md-12 tm-header');
                        for (var k in lexias) {
                            if (opts.page_id==lexias[k].lexiaId) continue;
                            $('<div></div>').appendTo($internal).html('<a href="' + lexias[k].url + ((lexias[k].anchor.length)?'#'+lexias[k].anchor:'') + '" target="_blank">' + lexias[k].heading + '</a>').addClass('col-md-11 col-md-offset-1 tm-anchor body_font');
                            $('<div></div>').appendTo($internal).html(strip_tags(lexias[k].excerpt)).addClass('col-md-11 col-md-offset-1 tm-excerpt body_font');
                        }
                    }
                    if ($internal.is(':empty')) {
                        $('<div>There are no related pages for this tag in this document.<br /><br /></div>').appendTo($internal).addClass('col-md-12');
                    };
                } else {
                    // If internal data is not being processed, remove internal tab from modal
                    $tabs.children('li:eq(1)').remove();
                }
                    

                // builds table of external tag-related data (from thoughtmesh)
                var $external = $('<div />').addClass('row').appendTo($tab_content.find('div:first'));
                if ($.isEmptyObject(outsideLexiasObj)) $('<div>There are outside pages for this tag.</div>').appendTo($external).addClass('col-md-12');
                for (var j in outsideLexiasObj) {
                    var entry = outsideLexiasObj[j];
                    $('<div></div>').appendTo($external).html(entry.author + ',&nbsp;"<a href="' + entry.url + '" target="_blank">' + entry.title + '</a>"').addClass('col-md-12 tm-header');
                    for (var k in entry['lexias']) {
                        var lexia = entry['lexias'][k];
                        $('<div></div>').appendTo($external).html('<a href="' + entry.url + ((lexia.anchor.length)?'#'+lexia.anchor:'') + '" target="_blank">' + lexia.heading + '</a>').addClass('col-md-11 col-md-offset-1 tm-anchor body_font');
                        $('<div></div>').appendTo($external).html(strip_tags(lexia.excerpt)).addClass('col-md-11 col-md-offset-1 tm-excerpt body_font');
                    }
                };
                $('<div class="row">&nbsp;</div>').appendTo($container);
            });
        };

        var renderScalar = function() {
            // Plugin shell
            var $wrapper = $('<div class="tm_footer container-fluid"><div class="tm_logo caption_font">ThoughtMesh &nbsp; <a href="javascript:void(null);" class="glyphicon glyphicon-question-sign" title="What is ThoughtMesh?"></a></div></div>').appendTo($this);
            if ($.isEmptyObject(obj.external)) {
                var $header = $('<div class="row"><div class="col-xs-12 tm-no-match">Unfortunately, no pages in the ThoughtMesh network match\ the tags for this Scalar book.</div></div>').appendTo($wrapper);
            } else {
                var $header = $("<div class='row'><div class='col-md-2 col-sm-2 col-xs-2'></div><div class='col-md-6 col-sm-6 col-xs-10'><div class=\"tm-header\">Related documents</div></div><div class='col-md-4 col-sm-4 hidden-xs'><div class=\"tm-header\">Related keywords</div></div></div>").appendTo($wrapper);
            };
            // Opens Information box modal
            $wrapper.find('.glyphicon:first').click(function() {
                bootbox.dialog({
                    message: '<p>ThoughtMesh is an unusual model for publishing and discovering scholarly papers online. It gives readers a tag-based navigation system that uses keywords to connect excerpts of essays published on different Web sites.</p><p>Add your Scalar book to the mesh, and ThoughtMesh gives readers a tag cloud that enables nonlinear access to text excerpts. You can navigate across excerpts both within the original essay and from related essays distributed across the mesh.</p>By clicking tags in the ThoughtMesh plugin you can view a list of excerpts of other pages of this book or of other articles similarly tagged, and jump right to one of those sections.</p><form class="to_tm_button" action="http://thoughtmesh.net" target="_blank"><button class="btn btn-primary" type="submit">ThoughtMesh home page</button></form>',
                    title: 'What is ThoughtMesh?',
                    className: 'thoughtmesh_bootbox',
                    animate: ((navigator.userAgent.match(/(iPod|iPhone|iPad)/)) ? false : true) // Panel is unclickable if true for iOS
                });
                $(this).blur();
            });

            // List most relevant articles and their tags
            for (var i in obj.external) {
                var $row = $('<div class="row"><div class="tm-tag col-md-2 col-sm-2 col-xs-2"></div><div class="tm-article col-md-6 col-sm-6 col-xs-10"></div><div class="tm-key col-md-4 col-sm-4 hidden-xs"></div></div>').appendTo($wrapper);
                var $article = $row.children('.tm-article:first');
                // Author
                $("<span class='tm-author'></span>").html(obj.external[i].author + ',&nbsp;').appendTo($article);
                // Title
                $('<a href="' + obj.external[i].url + '" target="_blank" class="tm-text"></a>').html(obj.external[i].title).appendTo($article);
                // Tags
                var their_tags = obj.external[i].tags;
                for (var j in obj.external[i].matched_tags) {
                    var $glyph = $('<a href="javascript:void(null);" class="glyphicon glyphicon-tag" data-toggle="tooltip" data-placement="top" title="' + obj.external[i].matched_tags[j] + '"></a>').appendTo($row.children('.tm-tag'));
                    $glyph.data('tm-tag', obj.external[i].matched_tags[j]);
                };
                $row.children('.tm-tag').children().click(tagModal);
                // Keywords
                var keyhtml = '';
                $keys = $row.children('.tm-key');
                for (var j = 0; j < their_tags.length; j++) {
                    if (0 != j) $keys.append(',&nbsp;');
                    var $key = $('<a href="javascript:void(null);" class="tm-link"></a>');
                    $key.html(their_tags[j]);
                    $key.data('tm-tag', their_tags[j]);
                    $key.appendTo($keys);
                };
                $keys.children().click(tagModal);
            }
        }

        var renderWordpress = function() {
            console.log('rendering');
            // Plugin shell
            var $wrapper = $('<div class="tm_footer container-fluid"><div class="tm_logo caption_font">ThoughtMesh &nbsp; <a href="javascript:void(null);" class="glyphicon glyphicon-question-sign" title="What is ThoughtMesh?"></a></div></div>').appendTo($this);
            if ($.isEmptyObject(obj.external)) {
                var $header = $('<div class="row"><div class="col-xs-12 tm-no-match">Unfortunately, no pages in the ThoughtMesh network match\ the tags for this Scalar book.</div></div>').appendTo($wrapper);
            } else {
                var $header = $("<div class='row'><div class='col-md-2 col-sm-2 col-xs-2'></div><div class='col-md-6 col-sm-6 col-xs-10'><div class=\"tm-header\">Related documents</div></div><div class='col-md-4 col-sm-4 hidden-xs'><div class=\"tm-header\">Related keywords</div></div></div>").appendTo($wrapper);
            };
            // Opens Information box modal
            $wrapper.find('.icon-tag:first').click(function() {
                bootbox.dialog({
                    message: '<p>ThoughtMesh is an unusual model for publishing and discovering scholarly papers online. It gives readers a tag-based navigation system that uses keywords to connect excerpts of essays published on different Web sites.</p><p>Add your Scalar book to the mesh, and ThoughtMesh gives readers a tag cloud that enables nonlinear access to text excerpts. You can navigate across excerpts both within the original essay and from related essays distributed across the mesh.</p>By clicking tags in the ThoughtMesh plugin you can view a list of excerpts of other pages of this book or of other articles similarly tagged, and jump right to one of those sections.</p><form class="to_tm_button" action="http://thoughtmesh.net" target="_blank"><button class="btn btn-primary" type="submit">ThoughtMesh home page</button></form>',
                    title: 'What is ThoughtMesh?',
                    className: 'thoughtmesh_bootbox',
                    animate: ((navigator.userAgent.match(/(iPod|iPhone|iPad)/)) ? false : true) // Panel is unclickable if true for iOS
                });
                $(this).blur();
            });

            // List most relevant articles and their tags
            for (var i in obj.external) {
                var $row = $('<div class="row"><div class="tm-tag col-md-2 col-sm-2 col-xs-2"></div><div class="tm-article col-md-6 col-sm-6 col-xs-10"></div><div class="tm-key col-md-4 col-sm-4 hidden-xs"></div></div>').appendTo($wrapper);
                var $article = $row.children('.tm-article:first');
                // Author
                $("<span class='tm-author'></span>").html(obj.external[i].author + ',&nbsp;').appendTo($article);
                // Title
                $('<a href="' + obj.external[i].url + '" target="_blank" class="tm-text"></a>').html(obj.external[i].title).appendTo($article);
                // Tags
                var their_tags = obj.external[i].tags;
                for (var j in obj.external[i].matched_tags) {
                    var $glyph = $('<a href="javascript:void(null);" class="icon-tag" data-toggle="tooltip" data-placement="top" title="' + obj.external[i].matched_tags[j] + '"></a>').appendTo($row.children('.tm-tag'));
                    $glyph.data('tm-tag', obj.external[i].matched_tags[j]);
                };
                $row.children('.tm-tag').children().click(tagModal);
                // Keywords
                var keyhtml = '';
                $keys = $row.children('.tm-key');
                for (var j = 0; j < their_tags.length; j++) {
                    if (0 != j) $keys.append(',&nbsp;');
                    var $key = $('<a href="javascript:void(null);" class="tm-link"></a>');
                    $key.html(their_tags[j]);
                    $key.data('tm-tag', their_tags[j]);
                    $key.appendTo($keys);
                };
                $keys.children().click(tagModal);
            }
        }        

        // localStorage not supported
        if ("undefined" == typeof(Storage)) {
            $wrapper.append('<div class="row"><div class="col-xs-10 col-xs-offset-2">This browser does not support localStorage and therefore doesn\'t support this plugin.</div></div>');
            return;
        };
        // !!! directly references bookId (why?), must generalize
        // Go ahead and generate if it hasn't happened already
        if ($.isEmptyObject(localStorage[opts.namespace]) || (opts.platform == "scalar" && ('undefined' == typeof(JSON.parse(localStorage[opts.namespace]).bookId) || opts.book_id != JSON.parse(localStorage[opts.namespace]).bookId))) {
            if (!$.isEmptyObject(localStorage[opts.namespace])) localStorage.removeItem(opts.namespace);

            if(opts.buildInternal) {
                $.fn.thoughtmesh.setInternalData({
                    callback: function(obj) {
                        $.fn.thoughtmesh.setExternalData({
                            'documentId': obj.documentId,
                            'tags': obj.tags,
                            callback: function() {
                                $this.thoughtmesh(options);
                            }
                        });
                    }
                });
            } else {
                $.fn.thoughtmesh.setExternalData({
                    'documentId': opts.book_id,
                    'tags': options.externalTags,
                    callback: function() {
                        $this.thoughtmesh(options);
                    }
                 });
            }
            // Kills this instance of thoughtmesh(). Code continues from Callback above.
            return;
        };
        // Get data object
        var obj = JSON.parse(localStorage[opts.namespace]);
        if ($.isEmptyObject(obj) || 'undefined' == typeof(obj.external) || 'undefined' == typeof(obj.internal)) {
            alert('ThoughtMesh storage object formatted incorrectly')
            return; // No data, so don't draw the plugin
        };

        // Decide whether to render html or just send raw data to platform
        if ('undefined' == typeof(opts.render) || opts.render) {
            switch(opts.platform) {
                case 'scalar':
                    renderScalar();
                    break;
                case 'wordpress':
                    renderWordpress();
                    break;
            }
        } else { //if !opts.render
            // Raw data can be grabbed from localStorage
            return;
        }
        if(opts.platform == "scalar") {
            $('[data-toggle="tooltip"]').tooltip();
            // !!! Directly uses scalar hidden data. Generalize!
            // John sez: Wordpress pulls this script in through the PHP, so it can stay as is. Maybe this whole
            // conditional should move to renderScalar()?
            $.getScript($('link#approot').attr('href') + 'plugins/thoughtmesh/lib/bootbox.min.js', function(data, textStatus, jqxhr) {});
        }
    }; // $.fn.thoughtmesh




    // returns most common tags from text provided
    $.fn.thoughtmesh.getLexiaTags = function(text, maxTags, options) {
        var opts = $.extend({}, defaults, options);
        if(typeof(maxTags) == 'undefined') maxTags = 3;
        // if (-1!=window.location.href.indexOf('lireneocalhost')) 
            // return ['art','performance','media'];  // Temp for demo
        // Get word count
        if (!text.length) return text;
        var words = text.match(/\b\w+\b/g);
        if (!words.length) return [];
        var counts = {};
        for (var i = 0, len = words.length; i < len; i++) {
            var word = words[i].toLowerCase();
            if (word.length < 4) continue;  // magic number
            if (-1 != opts.skip_words.indexOf(word)) continue;
            counts[word] = (counts[word] || 0) + 1;
        };
        // Get top words
        var sortable = [];
        for (var word in counts) {
            sortable.push([word, counts[word]]);
        };
        if (!sortable.length) return sortable;
        sortable.sort(function(a, b) {
            return b[1] - a[1]
        });
        var tags = sortable.slice(0, maxTags);
        var to_return = [];
        for (var j = 0; j < tags.length; j++) {
            to_return.push(tags[j][0]);
        }
        return to_return;
    };




    $.fn.thoughtmesh.setInternalData = function(options) {
        var opts = $.extend({}, defaults, options);
        var parent = opts.parent;
        if ('undefined' == typeof(opts.parent) && $('link#parent').length) {
            parent = $('link#parent').attr('href');
        } else if ('undefined' == typeof(opts.parent)) {
            alert('Can\'t find "parent" string in order to set internal data');
            return;
        };
        if ('undefined' == typeof(opts.skip_words)) {
            opts.skip_words = ['nbsp', 'is', 'through', 'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'];
        };
        // !!!WP what will these (book_name, book_id, book authors) look like? Just provide using options?
        if ('undefined' == typeof(opts.book_name)) {
            opts.book_name = ($('[property="og:site_name"]').length) ? $('[property="og:site_name"]').attr('content') : '(No title)';
        };
        if ('undefined' == typeof(opts.book_id)) {
            opts.book_id = ($('link#book_id').length) ? parseInt($('link#book_id').attr('href')) : 0;
        };
        if ('undefined' == typeof(opts.book_authors)) {
            opts.book_authors = [];
            $('[rel="sioc:has_owner"]').each(function() {
                var user_uri = $(this).attr('href');
                user_uri = user_uri.substr(0, user_uri.indexOf('#'));
                var fullname = $('[resource="' + user_uri + '"]:first').children('[property="foaf:name"]').text();
                opts.book_authors.push(fullname);
            });
            opts.book_authors = opts.book_authors.join(',');
        };
        if ($.isEmptyObject(localStorage[opts.namespace])) {
            var obj = {
                'bookId': opts.book_id,
                'documentGroups': {},
                'internal': {},
                'external': {}
            };
        } else {
            var obj = JSON.parse(localStorage[opts.namespace]);
        };
        var book_urn = 'urn:scalar:book:' + opts.book_id;



        // Builds Tags for entire "Submesh"
        var getDocumentTags = function(lexias) {
            // Get word count
            var counts = {};
            for (var i = 0; i < lexias.length; i++) {
                for (var j = 0; j < lexias[i].tags.length; j++) {
                    var word = lexias[i].tags[j];
                    if (-1 != opts.skip_words.indexOf(word)) continue;
                    counts[word] = (counts[word] || 0) + 1;
                };
            };
            // Get top words
            var sortable = [];
            for (var word in counts) {
                sortable.push([word, counts[word]]);
            };
            if (!sortable.length) return sortable;
            sortable.sort(function(a, b) {
                return b[1] - a[1]
            });
            var tags = sortable.slice(0, 3);
            var to_return = [];
            for (var j = 0; j < tags.length; j++) {
                to_return.push(tags[j][0]);
            }
            return to_return;
        };

        obj.internal[book_urn] = {
            "documentId": opts.book_id,
            "title": opts.book_name,
            "author": opts.book_authors,
            "url": parent,
            "tags": [],
            "lexias": [],
            "tmp":window.location.href
        };

        if ('/' != parent.substr(parent.length - 1, 1)) parent += '/';
        // !!!WP how will this info be pulled?
        var url = parent + 'rdf/instancesof/page?format=json';
        $.getJSON(url, function(json) {
            if ($.isEmptyObject(json)) return;
            for (var uri in json) {
                // Get lexia text
                if ('undefined' == typeof(json[uri]['http://rdfs.org/sioc/ns#content'])) continue;
                var text = strip_tags(json[uri]['http://rdfs.org/sioc/ns#content'][0].value);
                var title = json[uri]['http://purl.org/dc/terms/title'][0].value;
                var version_urn = json[uri]['http://scalar.usc.edu/2012/01/scalar-ns#urn'][0].value;
                var version_id = parseInt(version_urn.substr(version_urn.lastIndexOf(':') + 1));
                var page_uri = json[uri]['http://purl.org/dc/terms/isVersionOf'][0].value;
                var page_urn = json[page_uri]['http://scalar.usc.edu/2012/01/scalar-ns#urn'][0].value
                var page_id = parseInt(page_urn.substr(page_urn.lastIndexOf(':') + 1));
                var tags = $.fn.thoughtmesh.getLexiaTags(text);
                if (!tags.length) continue;
                var lexia = {
                    "lexiaId": version_id,
                    "anchor": "",
                    "url": page_uri,
                    "heading": title,
                    "excerpt": ((text.length > 100) ? text.substr(0, 100) + ' ...' : text),
                    "tags": tags
                };
                obj.internal[book_urn].lexias.push(lexia);
            };
            // Builds tags for book from page tags
            obj.internal[book_urn].tags = getDocumentTags(obj.internal[book_urn].lexias);
            // Save updated object
            localStorage[opts.namespace] = JSON.stringify(obj);
            if ('undefined' != typeof(opts.callback)) {
                opts.callback({
                    'documentId': obj.internal[book_urn].documentId,
                    'tags': obj.internal[book_urn].tags
                });
            };
        });
    }; // $.fn.thoughtmesh.setInternalData

    // Builds data from connections through thoughtmesh
    $.fn.thoughtmesh.setExternalData = function(options, next) {
        var opts = $.extend({}, defaults, options);
        var document_id = opts.documentId;
        var group_id = 0; // Temp
        if('undefined' == typeof(opts.tags) || opts.tags.length == 0) {
            if ($.isEmptyObject(localStorage[opts.namespace])) {
                var obj = {
                    'bookId': document_id,
                    'internal': {},
                    'external': {}
                };
                localStorage[opts.namespace] = JSON.stringify(obj);
            }
            return;
        }
        var tags = opts.tags;
        var tags_to_send = [];
        if ('undefined' == typeof(next)) next = 3;
        switch (next) {
            case 3:
                tags_to_send = tags.slice();
                next = 2.1;
                break;
            case 2.1:
                tags_to_send = tags.slice(0, 2);
                next = 2.2;
                break;
            case 2.2:
                tags_to_send = tags.slice(1, 3);
                next = 2.3;
                break;
            case 2.3:
                tags_to_send = [tags[0], tags[2]];
                next = 1.1;
                break;
            case 1.1:
                tags_to_send = [tags[0]];
                next = 1.2;
                break;
            case 1.2:
                tags_to_send = [tags[1]];
                next = 1.3;
                break;
            case 1.3:
                tags_to_send = [tags[2]];
                next = 0;
                break;
        };
        $.getScript('//thoughtmesh.net/export/outsideLexias.json.php?tag=' + encodeURIComponent(tags_to_send.join(',')) + '&documentid=' + document_id + '&groupid=' + group_id + '&external=1&time=' + $.now(), function() {
            outsideLexiasFun();
            if ('undefined' == typeof(outsideLexiasObj)) {
                alert('Something went wrong attempting to get tag information from ThoughtMesh. Please try again');
                return false;
            };
            if ($.isEmptyObject(localStorage[opts.namespace])) {
                var obj = {
                    'bookId': opts.documentId,
                    'documentGroups': documentGroups,
                    'internal': {},
                    'external': {}
                };
            } else {
                var obj = JSON.parse(localStorage[opts.namespace]);
            };
            if ($.isEmptyObject(obj.documentGroups)) obj.documentGroups = documentGroups;
            var count = 0;
            for (var j in outsideLexiasObj) {
                if ('undefined' != typeof(obj.external[j])) continue;
                obj.external[j] = outsideLexiasObj[j];
                obj.external[j].tags = tags_to_send.slice();
                obj.external[j].matched_tags = tags_to_send.slice();
                if (2==tags_to_send.length && count > 0) break;  // For now, cap the number of results per match
                if (1==tags_to_send.length && count == 0) break;  // For now, cap the number of results per match
                count++;
            };
            // $('.body_copy').append(JSON.stringify(obj));
            localStorage[opts.namespace] = JSON.stringify(obj);
            if (0 != next) {
                $.fn.thoughtmesh.setExternalData(options, next);
            } else if ('undefined' != typeof(opts.callback)) {
                opts.callback();
            }
        });
    }; // $.fn.thoughtmesh.setExternalData
}(jQuery));