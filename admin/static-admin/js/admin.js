
//global vars
var current_marker;

var public_text = {
    choose_avatar : "Choose your avatar and crop it.",
    map_message: "Double click where you are located. All the users will come to this location, so choose it carefully. Also change your adress from settings.",
    
	error_cropping: "Error, try again.",
	basic_info_edit : "Edit basic informations",
	
	//notify
	location_saved : "New location saved.",
	edit_adress : "You should also edit your adress here.",
};


//global functions
function get_date_format(){
     var today = new Date();
     var dd = today.getDate();
     var mm = today.getMonth()+1; //January is 0!

     var yyyy = today.getFullYear();
     if(dd<10){
        dd='0'+dd
     } 
     if(mm<10){
        mm='0'+mm
     } 
     return today = dd+'/'+mm+'/'+yyyy;
}


// ====================== google maps api //
function init_location(){
    	
	
	function callback(location){
	    var myLatlng = new google.maps.LatLng(location.lat,location.lng);

		var mapOptions = {
		  zoom:8,
		  center: myLatlng
		}
		var map = new google.maps.Map(document.getElementById("map"), mapOptions);

		var marker = new google.maps.Marker({
			position: myLatlng,
			title:"Your Location"
		});
		current_marker = marker;
		
		marker.setMap(map);

		map.addListener('dblclick', function(e) {
			placeMarkerAndPanTo(e.latLng, map);
		});
		
		setTimeout(function(){
		    google.maps.event.trigger(map, 'resize'); map.setCenter(marker.getPosition());
		},1000);
	}
	//get lat long
	if(!$('h3.adress').attr('position')){
	   function getLocation() {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(showPosition);
			} else {
				x.innerHTML = "Geolocation is not supported by this browser.";
			}
		}
		function showPosition(position) {
	        // callback({lat: position.coords.latitude, lng:position.coords.longitude});
	         
		}
		callback({lat:40.4167754, lng: -3.7037802});
		 
	}else{
	  //console.log(JSON.parse($('h3.adress').attr('position')));
	  callback(JSON.parse($('h3.adress').attr('position')));
	}

}

function placeMarkerAndPanTo(latLng, map) {
  current_marker.setMap(null);
  var marker = new google.maps.Marker({
    position: latLng,
    map: map
  });
  current_marker = marker;
  map.panTo(latLng);
  
  $('h3.adress').attr('position',JSON.stringify(latLng));
  update_ui.modal_message('location_saved');
  
  //add action
  $('div.close_modal, div#modal_background').attr('onclick','modal_box.close();modal_box.open("small",this,true)').attr('data',JSON.stringify({action:'edit_informations', delete_onclick:true, save_map_marker:true, notty: 'edit_adress'}));
}



//========================================== DOCUMENT READY ===============//

$(document).ready(function(){
    
	//local vars
	
    var api_link = "http://localhost:4100";
    var $live_data = $('ul.live_data');
	
    if(!localStorage['today'] || !localStorage['today_sent'])
	{
	  localStorage['today'] = get_date_format(); 
	  localStorage['today_sent'] = 0; 	
	}
    
	if(localStorage['today'] !== get_date_format()){
	  localStorage['today'] = get_date_format();
	  localStorage['today_sent'] = 0;
	}
	
	//if(typeof localStorage['logged'] == 'undefined'){
	//	window.location = '/admin';
	//} 
	//localStorage['logged'] = 1;
	
	
	//==================================================== SOCKET IO ============================//
	var socket = typeof io !== 'undefined' ? io.connect("http://localhost:4200") : {
		emit:function(){ return },
		on: function (){ return }
	};	
	var id = localStorage['logged'];
	
	socket.emit('register', id); //register to socket server
	
	socket.on('update_chart', function(day){
		update_chart(day);
	});
	
	socket.on('new_going', function(data){
		
		var encoding = JSON.parse(data);
		var parsed_data = JSON.parse(encoding);
		
		parsed_data.action = 'profile';
		
		$live_data.find('span.no_live_data').hide(); //edit here
		
		$live_data.prepend("<li onclick=modal_box.open('small',this,true) data='"+ JSON.stringify(parsed_data) +"' > <img src='"+ parsed_data.image +"' />  "+ parsed_data.name +" <span class='going'> </span></li>");
	});	
	
	socket.on('new_reported', function(data){
		
		$live_data.find('span.no_live_data').hide(); //edit here
		
		var encoding = JSON.parse(data);
		var parsed_data = JSON.parse(encoding);
		
		parsed_data.action = 'profile';
		
		$live_data.prepend("<li onclick=modal_box.open('small',this,true) data='"+ JSON.stringify(parsed_data) +"' > <img src='"+ parsed_data.image +"' />  "+ parsed_data.name +" <span> </span></li>");
	});

    //set cross domain cookie set
	$.ajaxSetup({
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      }
	});
	
	//=================================================== FUNCTIONS ===============================
	
	
	/* pie chart */
	window.update_piechart = function(percent){
		    percent = Math.ceil(percent);
		    var rest = 100 - percent;
			window.info = new Highcharts.Chart({
			chart: {
				renderTo: 'load',
				margin: [0, 0, 0, 0],
				backgroundColor: null,
                plotBackgroundColor: 'none',
			},
			title: {
				text: null
			},
			tooltip: {
				formatter: function() { 
					return this.point.name +': '+ this.y +' %';

				} 	
			},
		    series: [
				{
				borderWidth: 2,
				borderColor: '#F1F3EB',
				shadow: false,	
				type: 'pie',
				name: 'Income',
				innerSize: '65%',
				data: [
					{ name: 'Good', y: percent, color: '#b2c831' },
					{ name: 'Bad', y: rest, color: '#3d3d3d' }
				],
				dataLabels: {
					enabled: false,
					color: '#ffffff',
					connectorColor: '#efefef'
				}
			}]
		});
    }  
	/* chartist */
	window.init_chart = function(series){
  	  window.chart = new Chartist.Line('.section-graph', {
		  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
		  series: [
			series,
		  ]
		}, {
		  fullWidth: true,
		  chartPadding: {
			right: 40
		  }
		});
	}
	
	window.update_chart = function(day){
		//get data from current chart
	  	var current_data = chart.data;
	    
		//update current data
		current_data.series[0][day-1] = Number(current_data.series[0][day-1]) +1;
		console.log(current_data);
		chart.update(current_data);
	}

	$('div.editor').summernote({
	  height:265,
	  focus:false,
	  toolbar: [
        ['style', ['bold', 'italic', 'underline']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
		['picture',['picture']],
		['link',['link']],
		['hr',['hr']]
    ],
	});
   

   //  ============== ui functions 
   	window.modal_box = {
	   html: function(size, obj){
	       //modal_box.open('small',{img: 'images/cj.jpg', name:'Christ Johnson' ,description:'Experienced UX/UI deisgner in london, uk'});
	       switch(obj.action){
		     
			 //see user profile
		     
			 case 'profile':
			   var social_html = '';
			   var width = 0;
			   if(typeof obj.social !== 'undefined')
			     social_html = update_ui.render_social(obj.social);
			   
			   return "<div class='my-info' style='border-bottom:none;color:#182128'> <img class='portfolio-image' src='"+ obj.image +"' /> <h1>"+ obj.name +"</h1> <h2> "+ obj.description +" </h2> <div class='social group' style='width:"+width+"px'>"+ social_html +"</div> </div>";
			 
			 break;
			 
			 //general options 
			 
		     case 'edit_informations':
			   var infos = {
                 'company': obj.name == '' || !obj.name ? 'Company Name': obj.name,
				 'adress' : obj.adress == '' || !obj.adress ? 'Company Andress': obj.adress, 
				 'contact' : obj.contact == '' || !obj.contact ? 'Company Contact': obj.contact,
                 'description' : obj.description == '' || ! obj.description	 ? 'Short description' :obj.description			 
			   }			   
			   
			   if(obj.delete_onclick)
			     $('div.close_modal, div#modal_background').attr('onclick','modal_box.close()');
			   if(obj.notty)
			     update_ui.modal_message(obj.notty);
			 
			 
			   if(obj.save_map_marker){
				 var obj = {
					action : 'save_map_marker',
                    id: localStorage['logged'],
                    position: $('h3').attr('position')					
				 };
				 
				 post(obj, function(response){
					console.log(response);
					 
				 });
				 
			   }
			   
			   return "<form style='padding:10px;margin:0px' class='edit_company'>"+
			            "<input type='text' name='name' placeholder='"+ infos.company +"' />"+
					    "<input type='text' name='adress' placeholder='" + infos.adress +"' />"+
					    "<input type='text' name='contact' placeholder='" + infos.contact +"' />"+
						"<textarea name='description' style='min-height:20px;height:40px' placeholder='" + infos.description + "' />"+
						"<button class='save_company_data'>Save</button>"+
					  "</form>";
			
			 break;
		     
			 case 'avatar_edit':
			   return '<div class="imageBox"><div class="thumbBox"></div>' +
                      '<div class="spinner" style="display: none">Add image.</div>' +
                      '</div>'+
                      '<div class="action_imagebox">'+
					  '<input type="button" style="float:left; width: 250px" value="Click to choose image" onclick="click_file()" />'+
                      '<input type="file" id="file" style="display:none">' +
                      '<input type="button" id="btnCrop" value="Crop" style="float: right">'+
                      '<input type="button" id="btnZoomIn" value="+" style="float: right">'+
                      '<input type="button" id="btnZoomOut" value="-" style="float: right">'+
                      '</div>'+
                      '<div class="cropped"></div>'+
					  "<script type='text/javascript'>update_ui.modal_message('choose_avatar');init_cropbox();function click_file(){document.getElementById('file').click();}</script>";
			 break;
			 
			 case 'edit_location':
			   return "<div id='map'><script type='text/javascript'>update_ui.modal_message('map_message');init_location();</script></div>";
			 break;
			 
			 case 'company':
			 
			   
			   var percentage =  obj.satisfaction   || $('h2.satisfaction_rate').text();
			   var image = obj.image || $('img.img-circle').attr('src');
			   var name = obj.name || $('div.my_p').find('h1.name').text();
			   var description = obj.description || $('div.my_p').find('span.description').text();
			   var contact = obj.contact || $('div.my_p').find('h3.contact').text();
			   var id = obj.id  || localStorage['logged'];
			   
			   return "<div class='my-info' style='float:left;border-bottom:none;color:#182128;padding:10px;background-color:#182128;color:#ffffff;border-top:1px solid #464d52;width:100%'> <img style='float:left;width:120px' class='portfolio-image' src='"+ image +"' /> <div style='float:left;width:370px;margin-left:20px;height:100px'><h1 style='float:left;margin-top:5px'>"+ name +"</h1> <span  style='display:block;padding:5 5 5 0;float:left;text-align:left;width:100%'> Contact: " +contact+ "&nbsp;&nbsp;&nbsp;Rate: "+ percentage +" </span><h2 style='float:left;width:100%;text-align:left;margin-top:10px;'> "+ description +" </h2> </div>"+
     			      //"<div class='meta' style='margin-top:10px'>" +
					   // "<div class='html5-progress-bar'>" +
						//  "<div class='progress-bar-wrapper'>" +
						//	"<progress id='progressbar' value='" + percentage + "' max='100'></progress>" +
						//	"<span class='progress-value'>"+ percentage +"%</span>" +
						//  "</div>" +
				  	   // "</div>" +
                      //"</div></div>" +
					  "</div><div class='company_content'><center> <img src='/static/images/loading.gif' style='left:50%;margin-left:-20px;margin-top:20px;' /></center>" + 
					  "<script type='text/javascript'> update_ui.get_company_html(" + id + ");</script>" +
					  "</div>";
			 
			 break;
		   }
	   },
	   open: function(size, obj, serialized){
         if(serialized){
           obj = JSON.parse($(obj).attr('data').toString());
         }	     

		 //open background
		 $('div#modal_background').show();
		 
		 var element = $('div#modal').html("<div class='close_modal' onclick='modal_box.close()'>X</div>").append(modal_box.html(size, obj));
		 var window_size = {'width': $(window).width(), 'height':$(window).height()};
	     
		 //calculate element position
	     var modal_size = size == 'small' ? [320,310] : [550,400];
		 element.css({
		   'left': window_size.width/2 - modal_size[0]/2,
           'top' : window_size.height/2 - modal_size[1]/2,
           'width': modal_size[0],
           'height': modal_size[1]		   
		 }).show();
		 
	  },
	  close: function(){
		 $('div#modal, div#modal_background, div#loading_holder').hide();
	  }

	}
    
   window.update_ui = {
      
	  coming_users : function(value){
	    $('h1#users').text("Coming users : "+value);
	    return true;
	  },
	  add_offer : function(obj){
	    $('ul.offer_list').prepend('<li><div><span class="date">'+obj.date+'</span><span delete_id="' + obj.delete_id + '" class="delete"> Delete </span></div>'+ obj.text +'</li>');    
	    return true;
	  },
	  
	  modal_message: function(message){
	    $('#modal_message').remove(); // remove old messages
	    $('div#modal').append("<div id='modal_message' onclick='this.remove()'>"+ public_text[message] + "</div>");
	  },
	  add_loading : function(){
        $('div#modal_background,div#loading_holder').show();
	  },
	  render_user: function(json_data){
		 var $info = $('div.my-info');
		 //general info
		 $info.find('h1').text(json_data.name);
		 $info.find('h2').text(json_data.description);
         $info.find('span.email').text(json_data.email);
         
		 //social
		 if(typeof json_data.social !== 'undefined')
		   $info.find('.social').html(update_ui.render_social(json_data.social));
         else
           $info.find('.social').html(' ');
	     
		 //image
		 $info.find('img').attr('src', json_data.image);
	  },
	  render_social : function(json_social){
		if(typeof json_social !== 'object')
			json_social = JSON.parse(json_social);
	    var social_html = '';
        var width = 0;
	    /*
		for(a in json_social)
		  if(typeof json_social[a] !== 'undefined'){
			social_content = "<a style='background-color:#ffffff;width:26px;height:26px;border-radius:100%' href='" + json_social[a].link + "' class='"+ json_social[a].name.toLowerCase() +"'> "+ json_social.name +" </a>";
			social_html = typeof social_html == 'undefined' ? social_content : social_html + social_content;
			width = width + 30; //width of <a> element + margin
		  }
		*/
		return social_html;
	  },
	  get_company_html: function(id){
		  $.get(api_link + '/files/file-' + id + '.html', function(response){
			$('div#modal').find('div.company_content').html(response  || 'No content to display');
		  });
	  }
   }
   
   
   window.get_content = function(){
	  var obj = {
		action : 'get_content',
        id :localStorage['logged'],		
	  };
	   
	  get(obj, function(response){
		//console.log(response);
		if(response.status == 'done'){ 
			
			//add public profile info
			$('h1.name').text(response.company.name);
			$('h3.adress').text(response.company.adress).attr('position', response.company.coords);
			$('h3.contact').text(response.company.contact);
			$('span.description').text(response.company.description);
			if(response.company.image.length > 10)
			  $('img.img-circle').attr('src', response.company.image);
			
			//add offers
			if(response.offers.length >= 1){
			  
			  $('span.no_offers').remove();
			  
			  for(var a in response.offers){

                var temp_obj = {date:response.offers[a].date, delete_id : response.offers[a].id_offer, text:response.offers[a].text};
                update_ui.add_offer(temp_obj);			   
			  }
			}
			//console.log(response);
			//summernote editor
			$('.editor').summernote('code', response.html);
			
			//piechart
		    var v1 = response.company.going;
	        var v2 = response.company.going + response.company.reports;
	        var diffPercent = Math.ceil(((v1 / v2) * 100));
			if(v1 == 0 && v2 == 0)
			  diffPercent = 50;
			update_piechart(diffPercent);
			$('h2.satisfaction_rate').text(diffPercent + '%');
			
			
			//graph
			init_chart([
			  response.graph ? response.graph[0] || 0 :0, 
			  response.graph ? response.graph[1] || 0 :0, 
			  response.graph ? response.graph[2] || 0 :0, 
			  response.graph ? response.graph[3] || 0 :0, 
			  response.graph ? response.graph[4] || 0 :0, 
			  response.graph ? response.graph[5] || 0 :0, 
			  response.graph ? response.graph[6] || 0 :0, 
			]);
			
			//remove " complete profile " span
			if(response.company.coords.length > 10 && response.company.image.length > 10){
			  $('span.complete_profile').remove();
			  //enable submit button
			  $('input[name=submit]').removeAttr('disabled');
			}
			modal_box.close();
			
		}else{
			
		}
	  });
   }
   
   // update cropbox
   window.init_cropbox = function(){
        var options =
        {
            thumbBox: '.thumbBox',
            spinner: '.spinner',
            imgSrc: 'images/avatar.png'
        }
        var cropper = $('.imageBox').cropbox(options);
		$('#file').on('change', function(){
            var reader = new FileReader();
            reader.onload = function(e) {
                options.imgSrc = e.target.result;
                cropper = $('.imageBox').cropbox(options);
            }
            reader.readAsDataURL(this.files[0]);
            this.files = [];
        })
        $('#btnCrop').on('click', function(){
            var img = cropper.getDataURL();
            var $img_holder = $('img.img-circle');
            $img_holder.attr('src',img);
			post({action:'profile_picture', image:img, id:localStorage['logged']}, function( response ){
		      console.log(response);
			  if(response.status == 'done'){	
				modal_box.close();
			    $('body').scrollTop(0);
			  }else{
				update_ui.modal_message('error_cropping'); 
			  }
				
			});
        })
        $('#btnZoomIn').on('click', function(){
            cropper.zoomIn();
        })
        $('#btnZoomOut').on('click', function(){
            cropper.zoomOut();
        })
    }
   
   
   //get and post functions
   	function post(obj, callback){
	  $.post(api_link, obj ,function(response){
         callback(response);
	  },'JSON');
	}
	
	function get(obj, callback){
	  $.get(api_link, obj ,function(response){
		 callback(response);
	  },'JSON');
	}
   
   //============================================= UI LISTENERS =================== //
   
   //delete
   $(document).on('click','span.delete',function(){
     $(this).text('Sure?').addClass('confirm_delete');
     var $saved = $(this);
	 setTimeout(function(){
	   $saved.text('DELETE').removeClass('confirm_delete');
	 },5000);
   });
   
   $(document).on('click','span.confirm_delete',function(){
    
	 var obj = {
		 action : 'delete_offer',
		 delete_id : $(this).attr('delete_id'),
		 id: localStorage['logged']
	 };
	 
	 var $saved = $(this);
	 
	 $saved.text('Loading..');
	 
	 //make ajax call here
	 post(obj, function(response){
	   if(response.status == 'done'){
	     $saved.parent('div').parent('li').remove();
	   }else{
		 $saved.text('Error');  
	   }
	 });
	 
   });
   
   
   //post new offer
   $(document).on('click','input#submit',function(event){
     event.preventDefault();

     var obj = {
	   action : 'add_offer',
	   offer  : $('textarea#message').val(),
	   id : localStorage['logged'] // for demo only
     }
	 
	 var $saved = $(this);
	 var $adress = $('h3.adress');
	 
	 if(typeof $adress.attr('position') == 'undefined'){
       $saved.text('Add a location first.');
       return;	   
	 }else{
	   var location = JSON.parse($adress.attr('position'));
       if(!(location.lat && location.lng)){
	     $saved.text('Error, log in again.');
	     return;
	   }else{
		  obj.lat = location.lat;
		  obj.lng = location.lng;
	   }
     }
 
	 if(obj.offer.length < 50){
		$saved.val('Offer too short');
		return;
	 }
	 
	 if(localStorage['today_sent'] >= 3){
	   $saved.val("Enough for today");
	   return false;
	 }
	 
	 if(obj.offer.trim() != ''){
	   
	   //update ui here
	   
	   //request
	   $saved.text('Loading');
	   
	   $('span.no_offers').remove();
	   
	   post(obj,function(response){
		 if(response.status == 'done'){  
	       //on succes
	       update_ui.add_offer({
	         text: obj.offer,
		     date: get_date_format(),
		  	 delete_id: response.id,
	       });
		   $saved.val('Sent');
	       localStorage['today_sent']++;
		 }else{
		   $saved.text('Error, try again.');	
		 }
	   });
	    
	 }else{
	   $saved.val('Complete offer.');
	 } 	 
   });
   
   
   //edit profile modal
   $(document).on('click','span.li_settings',function(){
      var obj_modal = {
	    action: 'edit_informations',
		name: $('h1.name').text(),
		adress: $('h3.adress').text(),
		contact: $('h3.contact').text(),
		description : $('span.description').text()
	  }
	  
	  modal_box.open('small',obj_modal);
	  update_ui.modal_message('basic_info_edit');
   });
   //edit profile save
   $(document).on('click','button.save_company_data',function(event){
     event.preventDefault();   
     
	 var obj = {
	   name : $('input[name=name]').val() || $('input[name=name]').attr('placeholder'),
	   adress: $('input[name=adress]').val() || $('input[name=adress]').attr('placeholder'),
	   contact: $('input[name=contact]').val() || $('input[name=contact]').attr('placeholder'),
	   description: $('textarea[name=description]').val() || $('textarea[name=description]').attr('placeholder'),
	   action : 'edit_profile',
	   id: localStorage['logged']
	 }
	 var $saved = $(this);
	 
	 // if not empty
	 for(var a in obj){
	  if(typeof(obj[a]) !== 'undefined' && typeof obj[a] == 'string')
	    if(obj[a].trim() == ''){
		  $saved.text('Complete all forms');
		  return false;
	    }
	 }
	 
	 post(obj, function(response){
         
	     if(response.status == 'done'){
			 //on ajax call done
			 $('h1.name').text(obj.name);
			 $('h3.adress').text(obj.adress);
			 $('h3.contact').text(obj.contact);
			 $('span.description').text(obj.description);
			 
			 modal_box.close();
		 }else{
			 $saved.text('Error, try again.');
		 }
	 
	 });
	 
   });
   
   
   //edit my store location
   $(document).on('click','span.li_world, a.edit_location',function(){
     
	  modal_box.open('big',{action:'edit_location','current':$('h3.adress').text()});
	 
   });
   
   //* edit image modal */
   $(document).on('click','span.li_user, a.edit_avatar', function(){
     modal_box.open('big',{action:'avatar_edit'});
   });
   
   //save html presentation page
   $(document).on('click','button.save_html',function(){
     var markupStr = $('div.editor').summernote('code');
	 var obj = {
		action : 'create_file',
        data : markupStr,
        id : localStorage['logged']		
	 };
	 var $saved = $(this);
	 $saved.text('Loading..');
	 
	 post(obj, function(response){
		if(response.status == 'done'){
			$saved.text('Saved');
		    setTimeout(function(){
              $saved.text('Save Page');				
			},3000);
		}else{
			$saved.text('Error, try again');
		}
	 });
	 
   });
   
   // search 
   $(document).on('keyup', 'input[name=search]', function(e){
	    if(e.keyCode == 13){
			
			var $ul = $('ul.other_list');
			var obj = { action : 'search',
			                 id : localStorage['logged'],
							 val : $(this).val()};
			//console.log(obj);
			
			update_ui.add_loading();
			
			get(obj, function(response){
				console.log(response);
				if(response.status == 'done'){
					if(response.rows.length == 0){
						$ul.html("<p> No results. </p>");
					}else{
						$ul.html(' ');
					    for(var a in response.rows){
							var obj_t = { action : 'company'};
							
							//calculate percentage
							var v1 = response.rows[a].going;
							var v2 = obj_t.going + response.rows[a].reports;
							var satisfaction = Math.ceil(((v1 / v2) * 100));
							if(v1 == 0 && v2 == 0)
							  satisfaction = 50;
											
							obj_t.image = response.rows[a].image;
							obj_t.description = response.rows[a].description;
							obj_t.name = response.rows[a].name;
							obj_t.contact = response.rows[a].contact;
							obj_t.id = response.rows[a].id;
							obj_t.satisfaction = satisfaction;
							
							console.log(JSON.stringify(obj_t));
							
							$ul.append(" <li onclick=modal_box.open('big',this,true) data='"+JSON.stringify(obj_t)+"'><img src='" + obj_t.image + "' > <span> " +obj_t.name+ "</span> </li>");
						}	
					}
					modal_box.close();
				}else{
					$ul.html("<p> Error, try again </p>");
					modal_box.close();
				}
			});
		}
   });
   
   //logout
   $(document).on('click','span.logout', function(){
	   var obj = {action : 'logout'};
	   var $saved = $(this);
	   $(this).text('Loading..');
	   post(obj, function(response){
		  if(response.status == 'done'){
			   delete localStorage['logged'];
			   window.location = '/admin';
		  }else{
			  $saved.text('Error');
		  }
	   });
   });
   
});

function initMap(){ return; } 
