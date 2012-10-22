// ==UserScript==
// @name          中国科学技术大学图书馆豆瓣读书及荐购插件
// @namespace     http://lib.ustc.edu.cn/
// @description   豆瓣读书页面中显示图书馆借阅信息 改自http://userscripts.org/scripts/show/138107 添加了在图书馆没有图书时，提供一个链接，点击该链接即可完成推荐购书，不需要填写表单 
// @version	      v1.4
// @grant 	GM_xmlhttpRequest
// @grant 	GM_log
// @include       http://book.douban.com/subject/*
// ==/UserScript==

var title = document.title;


// subject title
var keyword1 = title.replace( '(豆瓣)', '' ).trim(); 
var book_title = encodeURIComponent( keyword1 );


// lib search url
var url_lib = 'http://opac.lib.ustc.edu.cn/opac/';
var url_search = 'http://opac.lib.ustc.edu.cn/opac/openlink.php?strText=' + book_title + '&strSearchType=title';

var html_title = '<div class="da3" style="margin-bottom:0px;padding-bottom:1px;"><img src="http://lib.ustc.edu.cn/lib/favicon.ico" width="15px;" height="15px;" style="margin-bottom:-2px;" /><b><a href="http://lib.ustc.edu.cn" target="_blank" style="font-size:medium">中国科学技术大学图书馆</a></b></div>';

var html_recommend_title = '<div class="da3" style="margin-bottom:0px;padding-bottom:1px;"><img src="http://lib.ustc.edu.cn/lib/favicon.ico" width="15px;" height="15px;" style="margin-bottom:-2px;" /><b><a href="http://lib.ustc.edu.cn" target="_blank" style="font-size:medium">中国科学技术大学图书馆</a></b></div>';

var html_body_start = '<div class="indent" style="padding-left:5px;border:1px #F4F4EC solid;"><ul class="bs">';
var html_body_yes = '';
var html_body_no = '<li>本馆没有您检索的馆藏书目</li>';

var html_body_end = '</ul>';
// "more" button if the items has more than 5
var html_body_endmore = '<div style="text-align:right; padding:5px 10px 5px 0px;"><a href="http://opac.lib.ustc.edu.cn/opac/openlink.php?strText=' +     book_title + '&strSearchType=title" target="_blank">更多&hellip;</a></div>';
var html_body_endend = '</div>';

var html_body_empty = '<div></div>';


var divprepend = function(cls,innerhtml,div_id,div_class){
    var obj = document.createElement("div");
    obj.setAttribute('id', div_id);
    obj.setAttribute('class', div_class);
    var clsobj = document.getElementsByClassName(cls)[0];
    var fstchild = clsobj.firstElementChild;

    obj.innerHTML = innerhtml; 
    fstchild.parentNode.insertBefore(obj,fstchild)
}


//把检索书目和推荐图书放在两个具有不同id的div标签里，方便对他们进行操作
divprepend('aside',html_body_empty,'ustc_lib', 'ustc_lib');
divprepend('ustc_lib',html_body_empty,'ustc_recommend', 'ustc_recommend');

document.getElementById('ustc_recommend').style.display = "none";

/*
 * type指的是查询的方式，是通过题名，还是ISBN，由于最终ISBN没有使用，所以只要只用到了title
*/
var extractinfo = function(responsetext, type){

    if(type == 'title')
    {
        var regtitlenav  = new RegExp("检索条件：题名=<font color=\"red\">(.*)</font>\\s+</font>\\s+结果数：<strong class=\"red\">(\\d+)</strong>");
    }
    else if(type == 'isbn')
    {
        var regtitlenav  = new RegExp("检索条件：ISBN/ISSN==<font color=\"red\">(.*)</font>\\s+</font>\\s+结果数：<strong class=\"red\">(\\d+)</strong>");
    }
    var mtitlenav = regtitlenav.exec(responsetext);
    
    
    if(mtitlenav == null){
        return {
            title: null,
            count:  0,
            bookitems : null
        };
    }
    else{
        var regbookitems = new RegExp("<div class=\"list_books\" id=\"list_books\">\\s+<h3><span class=\"doc_type_class\">(.*)</span><a href=\"(.*)\">\\d\.(.*)</a>\\s+(.*)\\s+</h3>\\s+<p>\\s+<span><strong>馆藏复本：</strong>(\\d+) <br />\\s+<strong>可借复本：</strong>(\\d+) </span>\\s+(.*)<br />\\s+(.*)\\s+</p>\\s+</div>","g");
        var mbookitems;
        var bookitems = [];
        var title = mtitlenav[1];
        var count = mtitlenav[2];

        while( (mbookitems = regbookitems.exec(responsetext)) !== null)
        {
            bookitems.push({
                doc_type:       mbookitems[1],
                book_url:       mbookitems[2],
                book_title:     mbookitems[3],
                book_id:        mbookitems[4],
                book_amount:    mbookitems[5],
                book_available:  mbookitems[6],
                book_author:    mbookitems[7],
                book_press:     mbookitems[8],
            });
        }

        return {
            title: title,
            count: count,
            bookitems: bookitems
        };

    }
}



var url = document.URL;

var douban_id = url.split('/')[4]

var douban_api_url= 'https://api.douban.com/v2/book/'+ douban_id

GM_xmlhttpRequest({
    method: 'GET',
    url: douban_api_url,
    onload: function(responseDetails) {
        var book_detail_json = responseDetails.responseText;
    	var book_detail = JSON.parse(book_detail_json);
    	var title = book_detail["title"];
    	var author = book_detail["author"];
    	var isbn = book_detail["isbn13"];
    	var pub = book_detail["publisher"];
    	var date = book_detail["pubdate"];
        var type = 'C';
        var test_type = /9787\d{9}/;
        if(!test_type.test(type))
        {
            GM_log("Matched!!")
            type = 'U';
        }
    	var url_recommend = 'http://opac.lib.ustc.edu.cn/asord/asord_redr.php?click_type=commit&title=' + keyword1 + '&a_name=' + author +'%8B&b_pub=' + pub + '&b_date=' + date + '&b_type='+ type + '&b_isbn=' + isbn
    	var html_recommend_book = '<li> <a href="' + url_recommend + '" target="_blank">推荐购书</a><span style="margin-left:10px">'
    	divprepend('ustc_recommend',html_body_start+html_recommend_book+html_body_end+html_body_endend);
    }
}); 


GM_xmlhttpRequest({
    method: 'GET',
    url: url_search,
    onload: function(responseDetails) {
        var bookinfo = extractinfo(responseDetails.responseText, 'title');
        if(bookinfo.count > 0){
            document.getElementById('ustc_recommend').style.display = "none";

            html_body_yes += '<li>题名： <strong>' + keyword1 + '</strong><span style="margin-left:10px"> 结果数： <strong>' + bookinfo.count + '</strong></span</li>';

            for(var i = 0; i < bookinfo.count; i++){
                var bookitem = bookinfo.bookitems[i];
                html_body_yes += '<li> <a href="' + url_lib + bookitem.book_url + '" target="_blank">' + bookitem.book_title + '</a><span style="margin-left:10px">' + bookitem.book_id + '</span><br/>' + '<span class="pl" style="margin-left: 20px">馆藏复本: ' + bookitem.book_amount + '<span style="margin-left:20px">可借复本： ' + bookitem.book_available + '</span></span><br/><span class="pl" style="margin-left:20px">' + bookitem.book_author + '<span style="margin-left:10px">' + bookitem.book_press + '</span></span></li>';
                if(i >= 4)
                    break;
            }

            if(bookinfo.count > 5)
                divprepend('ustc_lib',html_title+html_body_start+html_body_yes+html_body_end+html_body_endmore+html_body_endend);
            else
                divprepend('ustc_lib',html_title+html_body_start+html_body_yes+html_body_end+html_body_endend);
        }
        else{
            document.getElementById('ustc_recommend').style.display = "block";
            divprepend('ustc_lib',html_title+html_body_start+html_body_no+html_body_end+html_body_endend);
        }
    }
}); 
