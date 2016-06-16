//global functions
function get_date_format(minutes){
     var today = new Date();
     var dd = today.getDate();
     var mm = today.getMonth()+1; //January is 0!
     var hours = today.getHours();
	 var minutes = today.getMinutes();
	 
     var yyyy = today.getFullYear();
     if(dd<10){
        dd='0'+dd
     } 
     if(mm<10){
        mm='0'+mm
     } 
	 if(!minutes)
       return dd+'/'+mm+'/'+yyyy;
     else
	   return hours + " : "+ minutes ;
}

$(function() {

    //  notie.alert(2, 'Warning<br><b>with</b><br><i>HTML</i><br><u>included.</u>', 2);

    var $edit_profile = $('form.edit_profile');
	var $no_results = $("p.no_results");
	var visibleHeight = $(document).height() - $(window).height();
    var items;
	var api_link = 'http://localhost:4000/';
	var file_link = 'http://localhost:4100/files/';
	var current_location = '';
	var current_marker = '';
	var allow_domain_change = 0;
	
	var public_text = {
	  'test' : 'test modal box messages',
	  'map_exact_location': 'Please double click in the area where you are now.',
	  'last_map_location' : 'We positioned you where you were last time. Double click to change it.',
	  'location_saved': 'New location saved.',
	  'error_saving' : 'Error while saving new location',
	  'change_location' : 'Double click to change your current location'
	};
	
	var $content = $('div.content');
	
    //map location	
	if(!localStorage['map_location'])
	  localStorage['map_location'] = '';
    
	//filter
    if(!localStorage['domain'])
	   localStorage['domain'] = 'all';
   
    $('select[name=domain]').val(localStorage['domain']);
	setTimeout(function(){
	   allow_domain_change = 1;
	},500);
	
  
  
    //reset going to and reported everyday
    if(!localStorage['today'] || !localStorage['going_to'] || !localStorage['reported'])
	{
	  console.log('here');
	  localStorage['today'] = get_date_format(); 
	  localStorage['going_to'] = ' '; //set going
	  localStorage['reported'] = ' '; //set reported
	}
    
	//reset old values
	if(localStorage['today'] !== get_date_format()){
	  console.log('rwo');
	  localStorage['today'] = get_date_format();
	  localStorage['going_to'] = ' '; //reset going
	  localStorage['reported'] = ' '; //reset reported
	}
	
	
    storeElements();

    $(window).on('resize', function(e) {
        updateHeight();
    });

    $(window).on('scroll', function(e) {
        loadContent();
    });

	
	//set cross domain cookie set
	$.ajaxSetup({
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      }
	});
	
	window.loaded_page = function(){
	    
		//get my profile info
		get({action:'get_user_profile', id: localStorage['logged_user']},function(response){
		  //console.log(response);
		  update_ui.render_user(response);
		  //console.log(response);
		  //update current location
		  if(response.current_location.length > 10){
		    var split = response.current_location.split(',');
		    localStorage['map_location'] = JSON.stringify({lat:Number(split[0]), lng:Number(split[1])}); 
		  }
		  
		  update_ui.remove_loading();
		 
		  //if no avatar
	 	  if(response.image && response.image.length < 10){
			 $('p.add_image').show();
		  }
		 
		  //get offers
		  if(response.current_location.length > 10){
			  get({action:'get_offers', current_location : response.current_location, limit1 : 0, limit2: 20, domain: localStorage['domain']}, function(response){
				 console.log(response.rows);
				 if(response.status == 'done'){
				  if(response.rows.length > 0)
					update_ui.render_posts(response.rows);
				  else{
					$no_results.show();				  
					$('.portfolio-item').not(':first').remove();	
				  }
				}
			  });
		  }else{
			 $no_results.html(' To get offers, please click <a href="#"  data="{"action" : "change_map_location"}" onclick=modal_box.open("big",this,true)  class="edit_location"> here </a> and select your location.');  
		  }
		
		});
		
    }
	
	
	function loadContent() {

        if($(window).scrollTop() >= visibleHeight) {

            $(window).unbind('scroll');

            var loadingWrap = $('.loading-wrap');

            loadingWrap.fadeIn(function() {
                setTimeout(function() {
                    loadingWrap.before(items);
                    loadingWrap.hide(function() {
                        updateHeight();
                        storeElements();
                        $(window).on('scroll', function() { loadContent(); });
                    });
                }, 500);
            });

        }
    }

    function updateHeight() {
        visibleHeight = $(document).height() - $(window).height();
    }

    function storeElements() {
        items = $('.portfolio-item:lt(3)').clone();
        //Strip the first class from selection
        items.removeClass('first');
    }

    function check_empty_inputs(form, button, exceptions_list, callback){
	  
	  var form_val = {};
	  var call_sent = false;
	  
	  form.find('textarea,input').each(function(){
	    if((exceptions_list.indexOf($(this).attr('name')) < 0) && ( $(this).val() == '' || $(this).val().length < 2 )){
		  button.text('Complete all forms');
		  callback({status:false});
		  call_sent = true;
		  return false;
		}
		else
		  form_val[$(this).attr('name')] = $(this).val();
	    
	  });
	  
	  if(!call_sent) callback({status:true, values:form_val});
	  return;
	}
	
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
	
     
	function get_my_data(){ //get my profile info
		
		var $info = $('div.my-info.general');
		var social_json = [];
		  
		$info.find('div.social.group').find('a').each(function(){
			social_json.push({name:$(this).attr('class'), link:$(this).attr('href')});
		});
		
		return {
			image : $info.find('img.portfolio-image').attr('src'),
			name: $info.find('h1').text(),
			social_json : social_json,
			description: $info.find('h2').text()
		}
		
	}
	
	//google maps api
	window.get_directions = function(to_directions, directions_bool){
		  
		  if(!directions_bool){ //show no directions, just the map
		    var split = to_directions.split(',');
		    to_directions = {lat: Number(split[0]), lng: Number(split[1])};
		
		    var directionsDisplay = new google.maps.DirectionsRenderer;
		    var directionsService = new google.maps.DirectionsService;
		  }
		  
		  //add "click to select your exact location" message
		  if(localStorage['map_location'] == ''){
		    if(!directions_bool)
		      update_ui.modal_message('map_exact_location');
		  }else{
		    if(!directions_bool){
			  calculateAndDisplayRoute(directionsService, directionsDisplay, JSON.parse(localStorage['map_location']), to_directions);
			  update_ui.modal_message('last_map_location');
		    }
		  }
		  
		  var map = new google.maps.Map(document.getElementById('map'), {
			zoom: 14,
			center: localStorage['map_location'] == '' ? {lat: 45.84852000000001, lng: 22.169502} : JSON.parse(localStorage['map_location'])
		  });
		  
		  if(directions_bool){ //just change the current location from settings
		     
			 if(localStorage['map_location'] == '')
				update_ui.modal_message('map_exact_location');
			 else{
			   update_ui.modal_message('change_location');
			   current_marker = new google.maps.Marker({
                 position: JSON.parse(localStorage['map_location']),
                 map: map,
                 title: 'This is you'
               });
			 }
		  }
		  
          if(!directions_bool)
 		    directionsDisplay.setMap(map);
          
		  //fix map reload problem
		  setTimeout(function(){
			google.maps.event.trigger(map, 'resize'); map.setCenter(JSON.parse(localStorage['map_location']));
		  },1000);

		  google.maps.event.addListener(map, 'dblclick', function(event) {
		     var latlng = {lat:event.latLng.lat(), lng:event.latLng.lng()};
		     localStorage['map_location'] = JSON.stringify(latlng);
			 
			 if(!directions_bool){ //if user is not changin his location
               calculateAndDisplayRoute(directionsService, directionsDisplay, latlng, to_directions);
			 }else{ //if user is changin his location
			   
			   //remove old marker
               if(current_marker !== '')			   
			   current_marker.setMap(null);
			   
			   //add new marker
			   current_marker = new google.maps.Marker({
                 position: latlng,
                 map: map,
                 title: 'This is you'
               });
			   
			 }
			 //save new position to database
			 post({action:'save_coords', id: localStorage['logged_user'], coords: JSON.stringify(latlng)}, function(response){
				if(response.status == 'done'){
					update_ui.modal_message('location_saved');
				}else{
					update_ui.modal_message('error_saving');
				}
			 });
			 
          });
		
          function calculateAndDisplayRoute(directionsService, directionsDisplay, latlng, to_directions) {
			  var selectedMode = localStorage['travel_mode'] || 'WALKING';
			  directionsService.route({
			  
				  origin: latlng,
				  destination: to_directions,
				  travelMode: google.maps.TravelMode[selectedMode]
			  
			  }, function(response, status) {
				  if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
				  } else {
					window.alert('Directions request failed due to ' + status);
				  }
			  });
		  }
		
	}
	
	// ====================================== ui functions
	
	window.modal_box = {
	   html: function(size, obj, element){
	       switch(obj.action){
		   
		     case 'profile':
			   var social_html = '';
			   var width = obj.social.length * 40;
			   if(typeof obj.social !== 'undefined')
			     social_html = update_ui.render_social(obj.social);
			   
			   return "<div class='my-info' style='border-bottom:none;color:#182128'> <img class='portfolio-image' src='"+ obj.image +"' /> <h1>"+ obj.name +"</h1> <h2> "+ obj.description +" </h2> <div class='social group' style='width:"+width+"px'>"+ social_html +"</div> </div>";
			 
			 break;
			 
			 case 'company':
			 
			   
			   var v1 = obj.going;
	           var v2 = obj.going + obj.reports;
	           var percentage = Math.ceil(((v1 / v2) * 100))  || 50;
			   
			   var image = $(element).attr('src');
			   
			    return "<div class='my-info' style='float:left;border-bottom:none;color:#182128;padding:10px;background-color:#182128;color:#ffffff;border-top:1px solid #464d52;width:100%'> <img style='float:left;width:120px' class='portfolio-image' src='"+ image +"' /> <div style='float:left;width:370px;margin-left:20px;height:100px'><h1 style='float:left;margin-top:5px'>"+ obj.name +"</h1> <span  style='display:block;padding:5 5 5 0;float:left;text-align:left;width:100%'> Contact: " +obj.contact+ "&nbsp;&nbsp;&nbsp;Rate: "+ percentage +"% </span><h2 style='float:left;width:100%;text-align:left;margin-top:10px;'> "+ obj.description +" </h2> </div>"+
     			      //"<div class='meta' style='margin-top:10px'>" +
					   // "<div class='html5-progress-bar'>" +
						//  "<div class='progress-bar-wrapper'>" +
						//	"<progress id='progressbar' value='" + percentage + "' max='100'></progress>" +
						//	"<span class='progress-value'>"+ percentage +"%</span>" +
						//  "</div>" +
				  	   // "</div>" +
                      //"</div></div>" +
					  "</div><div class='company_content'> <img src='/static/images/loading.gif' style='left:50%;margin-left:-20px;margin-top:20px;' />" + 
					  "<script type='text/javascript'> update_ui.get_company_html(" + obj.id + ");</script>" +
					  "</div>";
			 
			 break;
			 
			 case 'users_list':
			   var html_li = '';
			   for(a in obj.going)
			     if(typeof obj.going[a] !== 'undefined'){
				   try{
					 obj.going[a] = JSON.parse(obj.going[a]);  
				     obj.going[a].action = 'profile'; //add html type
				     html_li += "<li data='"+ JSON.stringify(obj.going[a]) +"' onclick=modal_box.open('small',this,true)><span>" + obj.going[a].date + "</span><img src='" + obj.going[a].image +"'> " + obj.going[a].name + "</li>";
			       }catch(e){
					 continue; //json cannot be parsed  
				   }
				 }
			   return "<ul class='users_list'>"+ html_li +"</ul>";
			   
			 break;
			 
			 case 'map':
			   return "<div id='map'><script type='text/javascript'>get_directions('" + obj.directions + "');</script> </div>";
			 break;
			 
			 case 'change_map_location':
			   return "<div id='map'><script type='text/javascript'>get_directions(' ',true);</script> </div>";
			 break;
			 
			 case 'avatar_edit':
			   return '<div class="imageBox"><div class="thumbBox"></div>' +
                      '<div class="spinner" style="display: none">Add image</div>' +
                      '</div>'+
                      '<div class="action_imagebox">'+
					  '<input type="button" style="float:left; width: 250px" value="Click to choose image" onclick="click_file()" />'+
                      '<input type="file" id="file" style="display:none">' +
                      '<input type="button" id="btnCrop" value="Crop" style="float: right">'+
                      '<input type="button" id="btnZoomIn" value="+" style="float: right">'+
                      '<input type="button" id="btnZoomOut" value="-" style="float: right">'+
                      '</div>'+
                      '<div class="cropped"></div>'+
					  "<script type='text/javascript'>init_cropbox();function click_file(){document.getElementById('file').click();}</script>";
			 break;
		   }
	   },
	   open: function(size, element, serialized){
		   
		 if(serialized){
		   obj = JSON.parse($(element).attr('data').toString());
		 }	     

		 //open background
		 $('div#modal_background').show();
		 
		 var element = $('div#modal').html("<div class='close_modal' onclick='modal_box.close()'>X</div>").append(modal_box.html(size, obj, element));
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
		 $('div#modal,div#modal_background,div#loading_holder').hide();
	  }

	}
	
	
	window.update_ui = {
	  
	  render_user: function(json_data, only_general){

		 var $info = $('div.my-info');
		 //general info
		 $info.find('h1').text(json_data.name);
		 $info.find('h2').text(json_data.description);
         $info.find('span.email').text(json_data.email);
        
		 //social
		 if(typeof json_data.social !== 'undefined' && json_data.social.length > 2)
		   $info.find('.social').html(update_ui.render_social(json_data.social));
         else
           $info.find('.social').html(' ');
	     
		 if(only_general) return; //stop here 
		 
		 //image
		 $info.find('img').attr('src', json_data.image);
		 
		 //travel mode
		 $('select.travelModel').val(json_data.travelMode);
		 localStorage['travel_mode'] = json_data.travelMode;
	  },
	  
	  get_company_html: function(id){
		  $.get(file_link + 'file-' + id + '.html', function(response){
			$('div#modal').find('div.company_content').html(response  || 'No content to display');
		  });
	  },
	
	  render_posts: function(list){
		
		  var $first_item = $('.portfolio-item:lt(1)');
	      var items = $first_item.clone();
		  $('.portfolio-item').not(':first').remove();
		  $no_results.hide();
		  
		  
		  for(var a in list){
			
		    if(typeof list[a] !== 'undefined'){
			    var saved = $(items).removeClass('first');
			
				var $info = $(saved).find('.portfolio-info');
				var $image = $(saved).find('.portfolio-image');
				
				//============== create post html
				
				
				
				//add date
				$info.find('div.date').find('font.date').text(list[a].date);
				$info.find('div.date').find('span.name').text(list[a].name);
				
				//company logo and info
				var $company_img = $info.find('img.company_logo');
				$company_img.attr('src',list[a].image)
				$company_img.attr('data',JSON.stringify({
					name: list[a].name,
					description : list[a].description,
					adress: list[a].adress,
					contact : list[a].contact,
					going : list[a].going,
					reports : list[a].reports,
					action : 'company',
					id:list[a].owner
			    }));
				
				//description
				$info.find('div.description').text(list[a].text);
				
				//meta progress bar 
				var v1 = list[a].going;
	            var v2 = list[a].going + list[a].reports;
	            var progress = Math.ceil(((v1 / v2) * 100)) || 50;
				var $progress_bar = $info.find('.progress-bar-wrapper');
				$progress_bar.find('#progressbar').val(progress);
				$progress_bar.find('.progress-value').text(progress + '%'); 
				

                //map find
                var directions = list[a].lat + "," + list[a].lng; 				
				var href = "http://maps.googleapis.com/maps/api/staticmap?size=640x300&markers=color:blue|"+directions;
				var $map = $image.find('img.map');
				$map.attr('src',href);
				$map.attr("data",JSON.stringify({action: 'map', directions:directions}));
				
				//report and going
				if(localStorage['going_to'].search(',' + list[a].id_offer) < 0)
				  $info.find('span.going').attr('data',list[a].id_offer);
			    else 
				  $info.find('span.going').addClass('innactive').text('Going');
				
				if(localStorage['reported'].search(',' + list[a].id_offer) < 0)
				  $info.find('span.report').attr('data',list[a].id_offer);
				else  
				  $info.find('span.report').addClass('innactive').text('Reported');
			  
			    $info.find('span.going').attr('where', list[a].id);
			    $info.find('span.report').attr('where', list[a].id);
				
				//going list
				var $going = $info.find('ul.going').html('');
				$going.attr('data',JSON.stringify({action : 'users_list', going: list[a].going_list}));
				var limit_to_show = 8;
				var count_limit = 0;

				var going_unserialized = list[a].going_list;
				
				for(var b in going_unserialized){
				  if(typeof(going_unserialized[b]) !== 'undefined'){
					try {
					  var content = JSON.parse(going_unserialized[b]); //parse json
				      if(++count_limit > limit_to_show) break;

				      $going.append($('<li />').html('<img src="'+content.image+'" />'));
				    } catch (e){
			          //json cannot be parsed
					  continue;
					}
				  }
				}
				
				$(saved).find('.portfolio-image').find('img').attr('src',list[a].google_map);
				//console.log($(saved).html());

				$content.append("<div class='portfolio-item'>" + $(saved).html() + "</div>");
			}
		  }
	  },
	  add_loading : function(){
        $('div#modal_background,div#loading_holder').show();
	  },
	  remove_loading: function(){
	    $('div#modal_background,div#loading_holder').hide();
	  },
	  update_filter: function(city){
	  
	    $('select[name=domain]').val(city);
	  
	  },
	  modal_message: function(message){
	    $('#modal_message').remove(); // remove old messages
	    $('div#modal').append("<div id='modal_message' onclick='this.remove()'>"+ public_text[message] + "</div>");
	  },

	  render_social : function(json_social){
		if(typeof json_social !== 'object')
			json_social = JSON.parse(json_social);
	    var social_html = '';
        var width = 0;
	    for(a in json_social)
		  if(typeof json_social[a] !== 'undefined'){
			social_content = "<a style='background-color:#182128;width:26px;height:26px;border-radius:100%' href='" + json_social[a].link + "' class='"+ json_social[a].name.toLowerCase() +"'> "+ json_social.name +" </a>";
			social_html = typeof social_html == 'undefined' ? social_content : social_html + social_content;
			width = width + 30; //width of <a> element + margin
		  }
		return social_html;
	  },
      // button actions
 	  edit_profile: function(){
		  
 	    var $form = $('form.edit_profile');
	    var $profile = $('div.my-info.general');

 	    $form.find('input[name=name]').val($profile.find('h1').text());
        $form.find('textarea').val($profile.find('h2').text());
	    $form.find('input[name=email]').val($profile.find('span.email').text());

	    $profile.find('div.social').find('a').each(function(){
            $form.find('input[name=' + $(this).attr('class') + ']').val($(this).attr('href'));
        });
	    
	  }
	}
	
	// =============== CROPBOX
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
            var $img_holder = $('img.portfolio-image');
            $img_holder.attr('src',img);
			
			post({action:'save_user_image', image:img, id:localStorage['logged_user']},function(response){
			  $('p.add_image').hide();
			});
			
			modal_box.close();
			$('body').scrollTop(0);
			$img_holder.effect('highlight',400);
        })
        $('#btnZoomIn').on('click', function(){
            cropper.zoomIn();
        })
        $('#btnZoomOut').on('click', function(){
            cropper.zoomOut();
        })
     }
    
    //================ JQUERY listeners	
	
	$(document).on('click','nav.menus ul li',function(){
	  //igore this element
	  if($(this).hasClass('ignore')) return;	
		
	  var menu_class = $(this).attr('class');
      $('section.menu_contents').find('div.' + menu_class).show();
 	  
  	  if(typeof update_ui[menu_class] !== 'undefined')
        update_ui[menu_class]();
		
		
          
	  $('nav.menus ul li').each(function(){
	    if(!$(this).hasClass('back')){
		  $(this).hide();
		}
	    else
		  $(this).show();
	  });
	});
	
	$(document).on('click','li.back',function(){
	
	  $('section.menu_contents').find('div.menu_').each(function(){
	   $(this).hide();
	  });
	  
	  $('nav.menus').find('ul').find('li').each(function(){
		if(!$(this).hasClass('back'))
	      $(this).show();
	    else
		  $(this).hide();
	  });
	});
	

	$('.menus h3').on('click', function(e) {
        $(this).next('ul').toggleClass('open');
        updateHeight();
        e.preventDefault(); return false;
    });
	
	//user part
    $(document).on('click','form.edit_profile button[name=save_user]',function(e){
	
	  e.preventDefault();
	  
	  var $saved = $(this);
	  
	  check_empty_inputs($('form.edit_profile'),$saved,['facebook','google','dribble','twitter'],function(full_form){
	    
		if(full_form.status === true){
		          var obj = full_form.values;
                  var social = {facebook: obj.facebook, google: obj.google, twitter: obj.twitter, dribble:obj.dribble};
                  var render_list = []; 
           
                  $.each(social,function(index,val){
                  if(val != '')
 	                render_list.push({name:index, link:val});
		  });

		  obj.action = 'save_user_profile';
		  obj.social = JSON.stringify(render_list);
		  
		  //for demo
		  obj.id = localStorage['logged_user'];
		  console.log(full_form);
		  
		  post(obj,function(response){
		    if(response.status == 'done'){
                $saved.text('Done');
                update_ui.render_user({
				  social : render_list,
                  name: full_form.values.name,
                  description: full_form.values.description						
						  
			    }, true);
					  
		    }
		    else $saved.text('Error');
		  });
		
		}
		
	  });
	  
	  
	  
	});
	
	
	//going
	$(document).on('click','span.going',function(){
	  if(!$(this).hasClass('innactive')){
		  
		  //already going
		  if(localStorage['going_to'].search($(this).attr('data')) > -1)
			  return ;
		  
		  var $saved = $(this);
		  
		  var my_data = get_my_data();
		  
		  $saved.text('Loading..');
		  
		  var obj = {
			action : 'going',
			where : $saved.attr('where'),
			post_id : $saved.attr('data'),
			user_data : JSON.stringify({
				image : my_data.image,
				name : my_data.name,
				date: get_date_format(true),
				social : my_data.social_json,
				description : my_data.description
			}),
			id : localStorage['logged_user']		
		  }
		  
		  post(obj, function(response){
			 if(response.status == 'done'){
				$saved.text('Going');
                localStorage['going_to'] += ',' + $saved.attr('data');				
			 }else{
				$saved.text('Error');
			 }
		  });
	  }
	});	
	//reported
	$(document).on('click','span.report',function(){
	  if(!$(this).hasClass('innactive')){
		  
		  //already reported
		  if(localStorage['reported'].search($(this).attr('data')) > -1)
			  return ;
		  
		  var $saved = $(this);
		  
		  var my_data = get_my_data();
		  
		  $saved.text('Loading..');
		  
		  var obj = {
			action : 'report',
			where : $saved.attr('where'),
			user_data : JSON.stringify({
				image : my_data.image,
				name : my_data.name,
				date: 'now',
				social : my_data.social_json,
				description : my_data.description
			}),
			id : localStorage['logged_user']		
		  }
		  
		  post(obj, function(response){
			 if(response.status == 'done'){
				$saved.text('Reported');
                localStorage['reported'] += ',' + $saved.attr('data');				
			 }else{
				$saved.text('Error');
			 }
		  });
	  }
	});
	
	
	//Security and settings
	$(document).on('click','button[name=save_travel]', function(event){
		event.preventDefault();
		
		var $saved = $(this);
		var obj = {
		 travel: $('select.travelModel').val(),
		 action: 'save_travel',
		 id: localStorage['logged_user']
		}
		
		$saved.text('Loading..');
		
		post(obj,function(response){
			if(response.status == 'done'){
				$saved.text('Done');
			}
			else{
				$saved.text('Error');
			}
		});
			
	});
	
	//save new password
	$(document).on('click','button[name=save_password]', function(event){
	  event.preventDefault();
		
	  var $saved = $(this);
      var obj = {
		 id: localStorage['logged_user'],
		 action: 'save_password',
		 old_password: $('input[name=old_password]').val(),
         new_password: $('input[name=new_password]').val(),
         new_password2: $('input[name=new_password2]').val() 
	  }
	  
	  for(var a in obj){
		  if(obj[a] && obj[a].length < 2 && a != 'id'){
			 $saved.text('Complete all forms');
			 return;
		  }
	  }

      if(obj.new_password === obj.new_password2){
		  post(obj,function(response){
			 if(response.status == 'done')
				$saved.text('Done');
			 else{
				if(response.status == 'wrong')
				  $saved.text('Wrong password');
			    else
				  $saved.text('Error');
		  
		     }
		  });
	  }else{
		  $saved.text("Passwords don't match");
	  }
	  
	});
	
	//reload
	$(document).on('click','span.reload',function(){
		if(allow_domain_change == 1 && !$(this).hasClass('disabled')){
		  
		  update_ui.add_loading();
		  localStorage['domain'] = $('select[name=domain]').val();
		  
		  var $saved = $(this);
		  $saved.text('Reloaded');
		  $saved.addClass('disabled');
		  
		  setTimeout(function(){
			  $saved.text('Reload').removeClass('disabled');
		  },2000);
		  
		  var map_json = JSON.parse(localStorage['map_location']);
		 
		  //get offers
		  get({action:'get_offers', current_location : map_json['lat'] +',' +map_json['lng'], limit1 : 0, limit2: 20, domain: localStorage['domain']}, function(response){
			 if(response.status == 'done'){
			   console.log(response);
			   if(response.rows.length > 0)
			     update_ui.render_posts(response.rows);
			   else{
			     $no_results.show();
			     $('.portfolio-item').not(':first').remove();
			   }
			 }
			 
			 $saved.removeAttr('disabled');
			 update_ui.remove_loading();
		  });
		  
		} 
	});
	
	//select domain
	$(document).on('change','select[name=domain]', function(){
		if(allow_domain_change == 1){
		  
		  update_ui.add_loading();
		  localStorage['domain'] = $(this).val();
		  
		  var $saved = $(this);
		  $saved.attr('disabled',true);
		  
		  var map_json = JSON.parse(localStorage['map_location']);
		 
		  //get offers
		  get({action:'get_offers', current_location : map_json['lat'] +',' +map_json['lng'], limit1 : 0, limit2: 20, domain: localStorage['domain']}, function(response){
			 if(response.status == 'done'){
			   console.log(response);
			   if(response.rows.length > 0)
			     update_ui.render_posts(response.rows);
			   else{
			     $no_results.show();
			     $('.portfolio-item').not(':first').remove();
			   }
			 }
			 
			 $saved.removeAttr('disabled');
			 update_ui.remove_loading();
		  });
		  
		}
	});
	
   //Logout
   $(document).on('click','li.logout', function(){
	  var obj = {
		  action : 'logout',
	  }
	  var $saved = $(this);
	  post(obj, function(response){
		  if(response.status == 'done'){
			 // delete localStorage['logged_user'];
			  window.location = '/';
		  }else{
			  $saved.text('Error, please try again');
		  }
	  });
   });

});

function initMap(){ return; }
