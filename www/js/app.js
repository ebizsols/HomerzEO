/**
DRIVER APP
Version 1.8.0
*/

var ajax_url= krms_driver_config.ApiUrl ;
var dialog_title_default= krms_driver_config.DialogDefaultTitle;
var search_address;
var ajax_request = [];
var networkState;
var reload_home;
var translator;

var ajax_request2;
var ajax_request3;
var map;
var watchID;
var app_running_status='active';
var push;

var device_platform;
var app_version = "1.8.0";
var map_bounds;
var map_marker;
var map_style = [ {stylers: [ { "saturation":-100 }, { "lightness": 0 }, { "gamma": 1 } ]}];
var exit_cout = 0;
var device_id   = 'device_01231';

var $handle_location = [];
var $cron_interval =  10*1000;
var ajax_task;
var ajax_timeout = 50000;
var ajax_new_task;
var timer = {};
var map_navigator = 0;
var bgGeo;

jQuery.fn.exists = function(){return this.length>0;}

function dump(data)
{
	console.debug(data);
}

dump2 = function(data) {
	alert(JSON.stringify(data));	
};

function setStorage(key,value)
{
	localStorage.setItem(key,value);
}

function getStorage(key)
{
	return localStorage.getItem(key);
}

function removeStorage(key)
{
	localStorage.removeItem(key);
}

function explode(sep,string)
{
	var res=string.split(sep);
	return res;
}

function urlencode(data)
{
	return encodeURIComponent(data);
}

empty = function(data) {
	if (typeof data === "undefined" || data==null || data=="" || data=="null" || data=="undefined" ) {	
		return true;
	}
	return false;
}

function isDebug()
{
	var debug = krms_driver_config.debug;
	if(debug){
		return true;
	}
	return false;
}

function hasConnection()
{	
	return true;
}

$( document ).on( "keyup", ".numeric_only", function() {
  this.value = this.value.replace(/[^0-9\.]/g,'');
});	 

/*START DEVICE READY*/
document.addEventListener("deviceready", function() {
	
	try {
		
	   navigator.splashscreen.hide();
	
	   device_platform = device.platform;
	   
	   document.addEventListener("offline", noNetConnection, false);
	   document.addEventListener("online", hasNetConnection, false);
	   
	   document.addEventListener("pause", onBackgroundMode, false);
       document.addEventListener("resume", onForegroundMode, false);
	   
	   initFirebasex();
	   	   	   	   	   	   	   
    } catch(err) {
      alert(err.message);
    } 
    	
 }, false);
/*END DEVICE READY*/

// set device
ons.platform.select('android');
//ons.platform.select('ios');

/*onsen ready*/
ons.ready(function() {
		
	if (ons.platform.isIPhoneX()) {		
	    document.documentElement.setAttribute('onsflag-iphonex-portrait', '');
	    $('head').append('<link rel="stylesheet" href="css/app_ios.css?ver=1.0" type="text/css" />'); 	     
	}
	
	if (isDebug()){		
		setStorage("device_id","device_1233456789");
		device_platform = "Android";
	}
	
	setStorage('camera_on', 2 );
	
	ons.setDefaultDeviceBackButtonListener(function(event) {				
		exit_cout++;
		if(exit_cout<=1){		
			toastMsg( getTrans("Press once again to exit!","exit") );	
			 setTimeout(function(){ 
			 	 exit_cout=0;
			 }, 3000);
		} else {
			if (navigator.app) {
			   navigator.app.exitApp();
			} else if (navigator.device) {
			   navigator.device.exitApp();
			} else {
			   window.close();
			}
		}
	});
		
}); /*end ready*/


function setBaloon()
{
	var push_count = getStorage("push_count");
	if(empty(push_count)){
		push_count=0;
	}
	push_count=parseInt(push_count)+1;
	dump('setbaloon=>'+push_count);
	if (!empty(push_count)){
		if (push_count>0){
			setStorage("push_count", push_count );	
		    $(".baloon-notification").html(push_count);
		    $(".baloon-notification").show();
		}
	}
}


function noNetConnection()
{
	showDialog(true,'dialog_no_connection');
}


function hasNetConnection()
{	
	showDialog(false,'dialog_no_connection');
}

function refreshCon(action , params)
{
	if(empty(params)){
		params='';
	}
	dump(action);
	if (hasConnection()){
		callAjax(action,params)
	}
}

document.addEventListener("show", function(event) {	
	//dump( "page id show :" + event.target.id );	
	switch (event.target.id){		
		
		case "pageLogin":	
		/*if ( isAutoLogin()!=1){			
			checkGPS();			
		}*/
		break;				
		
		case "home":	
		    var onduty = document.getElementById('onduty').checked==true?1:2 ;			    
		    if ( onduty==1){		  	  	 
		  	  	 $(".duty_status").html( getTrans("On-Duty",'on_duty') );
		  	} else {		  	  	 
		  	  	 $(".duty_status").html( getTrans("Off-duty",'off_duty')  );
		  	}				
		  	reloadHome();  	  					  	  					  	 
		    checkGPS();	
		break;
		
		case "photoPage":			
		  callAjax('getTaskPhoto', 'task_id='+$(".task_id_details").val() );
		break;
		
		case "Signature":
		    callAjax('loadSignature', 'task_id='+$(".task_id_global").val() );
		break;
		
	}	
}, false);

document.addEventListener("init", function(event) {
		     
	     var page = event.target;	     
		 dump( "init page id :" + event.target.id );
		 
		 TransLatePage();
		 
		 switch (event.target.id) {		 
		 				
		 	case "completed_task_list":
		 	
		 	  map_navigator = 0;
		 	
		 	 setTimeout(function(){
			   $handle_location[1] =  setInterval(function(){runCron('foreGroundLocation')}, $cron_interval );		
			   $handle_location[2] =  setInterval(function(){runCron('getNewTask')}, $cron_interval );
		     }, 100);	  
				 	
		 	  if (!isDebug()){
		 	      window.plugins.insomnia.keepAwake();
		 	  }
		 	  
		 	  raw_date=getStorage('kr_todays_date_raw');
		 	  
		 	  setTimeout(function(){
		 	     callAjax("getTaskCompleted","date="+raw_date +"&task_type=completed" );
		 	  }, 1*500);
		 	  
		 	  setTimeout(function(){		 	  			 	  	
		 	  	if (!isDebug()){
			 	  	if(cordova.platformId === "android"){
			 	       initBackgroundTracking();			 	       
			 	  	} else if(cordova.platformId === "ios"){ 
			 	  	   initBackgroundLT();
			 	  	}
		 	  	}		 	  	
		 	  }, 100);
		 	  		 	  		 	 
		 	break;
		 	
			case "vehicle":
			case "changepassword":			  
			break;
						
						
			case "signup":
			
			 placeholder(".first_name_fields",'first_name');			 
			 placeholder(".last_name_fields",'last_name');
			 placeholder(".email_address_field",'email_address');
			 placeholder(".username_field",'username');
			 placeholder(".password_field",'password');
			 placeholder(".transport_description_field",'transport_description');
			 placeholder(".licence_plate_field",'licence_plate');
			 placeholder(".color_field",'color');
			
		     initIntelInputs();		     
		     callAjax("GetTransport",'');     		    
		    break;			
						
			case "Notes":			  			  
			break;
			
			case "Map":						  			 
			  task_lat = page.data.task_lat;
			  task_lng = page.data.task_lng;
			  address = page.data.delivery_address;
			  
			  map_provider = getMapProvider();
			  dump("map_provider=>"+ map_provider);
			  			  	
			  switch (map_provider){
			  	case "mapbox":
			  	  mapboxInitMap(task_lat,task_lng,address);
			  	break;
			  	
			  	default:
			  	  initMap(task_lat,task_lng,address);
			  	break;
			  }			  
			  
			break;
					    			
			case "Notification":
			  
			  callAjax('GetNotifications','');
			  
			   var pullHook = document.getElementById('pull-hook-notification');
			   pullHook.onAction = function(done) {						 	  
		              AjaxNotification("GetNotifications",'',done);
	             }; 
				 pullHook.addEventListener('changestate', function(event) {
				 	  var message = '';
				 	   dump(event.state);
				 	   switch (event.state) {
					      case 'initial':
					        message = '<ons-icon size="35px" icon="ion-arrow-down-a"></ons-icon> Pull down to refresh';
					        break;
					      case 'preaction':
					        message = '<ons-icon size="35px" icon="ion-arrow-up-a"></ons-icon> Release';
					        break;
					      case 'action':
					        message = '<ons-icon size="35px" spin="true" icon="ion-load-d"></ons-icon> Loading...';
					        break;
				      }
				      pullHook.innerHTML = message;
				});
			  
			break;
			
			case "Signature":
			case "profile":					
			
			break;
			
			case "OrderDetails":			   
			   
			   order_id = page.data.order_id;
			   callAjax("ViewOrderDetails",'order_id=' + order_id );
			break;
			
			case "pageGetSettings":		
							
			if (isDebug()){
				if ( hasConnection()){
				    callAjax("GetAppSettings",'');
				} else {				
				   toastMsg( getTrans("Not connected to internet","no_connection") );
				   $(".loading_settings").html( getTrans("Not connected to internet","no_connection") );
				   $(".refresh_net").show();
				}	  
			} else {
				document.addEventListener("deviceready", function() {	            
		           if ( hasConnection()){
				       callAjax("GetAppSettings",'');
					} else {				
					   toastMsg( getTrans("Not connected to internet","no_connection") );
					   $(".loading_settings").html( getTrans("Not connected to internet","no_connection") );
					   $(".refresh_net").show();
					}	             
	            }, false);
			}
            
			break;
			
			case "page-login":
			case "pageLogin":
			 			 
			 
			 document.getElementById("username_field")._input.focus();   	   
   	         placeholder(".username_field",'username');
   	         placeholder(".password_field",'password');
			
		     enabled_signup=getStorage("enabled_signup");
			 if(enabled_signup==1){
				 $(".sign-wrap").show();
			 }
			break;
			
			case "pageforgotpass":			
			   document.getElementById("email_field")._input.focus();   	   
   	           placeholder(".email_field",'email');
			break;
			
			case "SettingPage":			
			
			if (isDebug()){
		    	$(".software_version").html( "1.0" );
		    } else {
		    	$(".software_version").html( BuildInfo.version );
		    }
		    
		    device_id=getStorage('device_id');
   			if (!empty(device_id)){
   			  	$('.device_id').html( device_id );
   			}
		    			
			callAjax("GetSettings",'');
			
			
			break;
			
			case "profilePage":			
			  
			  callAjax("GetProfile",'');
			break;			
						
			case "viewTaskDescription":
			  $(".toolbar-title").html( getTrans("Getting info...",'getting_info')  );
			break;
			
			case "taskDetails":
			  $(".toolbar-title").html( getTrans("Getting info...",'getting_info')  );			
			  task_id = page.data.task_id;			
			  callAjax("TaskDetails",'task_id=' + task_id);
			break;
			
			case "CalendarView":
			  $params = getParamsArray();	
			  dump($params);
			  calendar_height = $("body").height();
   	          calendar_height = parseInt(calendar_height)-100;   	    
			  var calendarEl = document.getElementById('calendar');						 		
			  var calendar = new FullCalendar.Calendar(calendarEl, {
			  	  height: calendar_height,
		          plugins: [ 'dayGrid' ],
		          events: {
		          	 url: ajax_url+"/CalendarTask/",
		          	 method: 'POST',
		          	 extraParams: $params,
		          	 color: '#2E3B49', 
		          	 failure: function() {
				         //toastMsg(  t('error_parsing','there was an error while fetching events!') );
				     },				     
		          },	
		         loading : function(isLoading ){
				    dump("isLoading=>"+isLoading );
				    if(isLoading){
				    	loader.show();	
				    } else {
				    	hideAllModal();	
				    }
				 }, 	          
			     eventClick: function(info) {
			     	$even_date = info.event.start;			     	
			     	$todays_event_date = moment($even_date).format('YYYY-MM-DD');			     				     	
			     	setStorage('kr_todays_date_raw', $todays_event_date );
			     	
			     	kNavigator.popPage().then(function() {
			     		document.querySelector('ons-tabbar').setActiveTab(0);
			     		getTodayTask('');
			     		
			     		setTimeout(function(){			     		   
                           callAjax("getTaskCompleted","date="+$todays_event_date +"&task_type=completed" );	
			     		}, 300);				     		
			     		
			     	});
			     },
		      });
		      calendar.render();
			break;
						
			
			case "home":
			
			 var app_name=getStorage("app_name");
			 if(!empty(app_name)){
			    $(".app-title").html(app_name);
			 }
			 			 
			 break;

		   case "map_dropoff": 		 
		     
		     map_provider = getMapProvider();
		     dump("map_provider=>" + map_provider);
		     switch (map_provider){
		     	case "mapbox":
		     	  mapboxInitDropOffMap();
		     	break;
		     	
		     	default:
		     	  initMapDropOff();
		     	break;
		     }		     
		     break;
		     
		   case "pending_task_list":	
		      kr_todays_date = getStorage("kr_todays_date");
		      if(!empty(kr_todays_date)){
		        $(".todays_date").html( kr_todays_date );
		      } else {
		      	$(".todays_date").html( '' );
		      }
		      
		      on_duty = getStorage("kr_on_duty");
		      if(!empty(on_duty)){
			      if(on_duty==1){
			      	 onduty.checked=true;
				     $(".duty_status").html( getTrans("On-Duty",'on_duty') );
			      } else {
			      	 onduty.checked=false;
				     $(".duty_status").html( getTrans("Off-duty",'off_duty')  );
			      }
		      }
		      		      
		      getTodayTask('');

		      	      
             var pullHook = document.getElementById('pull-hook');
			 pullHook.onAction = function(done) {		
			 	  params="date="+ getStorage("kr_todays_date_raw");
			 	  var onduty = document.getElementById('onduty').checked==true?1:2 ;	
			 	  params+="&onduty="+onduty;
	              AjaxTask("GetTaskByDate",params,done);
             }; 
			 pullHook.addEventListener('changestate', function(event) {
			 	  var message = '';
			 	   dump(event.state);
			 	   switch (event.state) {
				      case 'initial':
				        message = '<ons-icon size="35px" icon="ion-arrow-down-a"></ons-icon> Pull down to refresh';
				        break;
				      case 'preaction':
				        message = '<ons-icon size="35px" icon="ion-arrow-up-a"></ons-icon> Release';
				        break;
				      case 'action':
				        message = '<ons-icon size="35px" spin="true" icon="ion-load-d"></ons-icon> Loading...';
				        break;
			      }
			      pullHook.innerHTML = message;
			 });
		      
			break;  							
			
			case "access_bg_location_permission":
			
			 $message = getPermissionMessage();			 
			 page_id = getCurrentPage();
			 
			 dump("page.data");
			 dump(page.data);
			
			 if ((typeof  $message.title !== "undefined") && ( $message.content !== null)) {
    	   	   $("#"+ page_id + " .page_title").html( $message.title );
    	   	   $("#"+ page_id + " .page_content").html( $message.content );
    	     }
    	     $("#"+ page_id + " .page_next").val( page.data.page_next );
						  			
			break;
			
			 	 
	 } /*end switch*/

	 /*end init page*/ 
	 
}, false);


function autoLogin()
{
	dump('autoLogin');
	var kr_remember = getStorage("kr_remember");	
	if ( kr_remember=="on"){
		var kr_username=getStorage("kr_username");
		var kr_password=getStorage("kr_password");
		var kr_remember=getStorage("kr_remember");
		if (!empty(kr_username) && !empty(kr_password)){
			dump('auto login');
			$("#frm-login").hide();
			$(".login-header").hide();
			$(".auto-login-wrap").show();
			var params="username="+kr_username+"&password="+kr_password+"&remember="+kr_remember;
			
			params+="&device_id="+ getStorage("device_id");
	        params+="&device_platform="+ device_platform;
			
			dump(params);
			callAjax("login",params);
		}
	}
}

function exitKApp()
{
	ons.notification.confirm({
	  message: getTrans("Are you sure to close the app?","close_app") ,	  
	  title: dialog_title_default ,
	  buttonLabels: [ "Yes" ,  "No" ],
	  animation: 'default', // or 'none'
	  primaryButtonIndex: 1,
	  cancelable: true,
	  callback: function(index) {	  	   
	  	   if (index==0){	  	   	      	   	  
				if (navigator.app) {
				   navigator.app.exitApp();
				} else if (navigator.device) {
				   navigator.device.exitApp();
				} else {
				   window.close();
				}
	  	   }
	  }
	});
}

function showPage(page_id, action )
{	
	if (action==1){
	   popover.hide();
	}
	var options = {
	  animation: 'slide',
	  onTransitionEnd: function(){		  
	  } 
	};  
	kNavigator.pushPage(page_id, options);		
}

var getTimeNow = function(){
	var d = new Date();
    var n = d.getTime();    
    n = parseInt(n) + parseInt(d.getMilliseconds());
    
    return n;
};	

/*mycall*/
function callAjax(action,params)
{
	try {
			
	dump("action=>"+action);	
	
	if ( !hasConnection() ){
		toastMsg( getTrans("Not connected to internet",'no_connection') );	
		return;
	}
	
	timenow = getTimeNow();
	dump("timenow=>"+timenow);
	
	params+=getParams();
	
	ajax_request[timenow] = $.ajax({
	  url: ajax_url+"/"+action,
	  method: "post" ,
	  data: params ,
	  dataType: "json",
	  timeout: ajax_timeout,
	  crossDomain: true,
	  beforeSend: function( xhr ) {
	  	
	  	  clearTimeout( timer[timenow] ); 
	  	
         if(ajax_request[timenow] != null) {			 				   
		   hideAllModal();	
           ajax_request[timenow].abort();
		 } else {    				
			loader.show();		

			timer[timenow] = setTimeout(function() {		
         		if( ajax_request[timenow] != null) {		
				   ajax_request[timenow].abort();
				   hideAllModal();	
         		}         		         		
	        }, ajax_timeout ); 
					
		 }
      }
    });
    
    ajax_request[timenow].done(function( data ) {
    	if (data.code==1){
    		
    		switch(action)
		   		{
		   			case "login":		
		   					   			
		   			setStorage("kr_username", data.details.username);
		   			setStorage("kr_password", data.details.password);
		   			setStorage("kr_remember", data.details.remember);
		   			setStorage("kr_todays_date", data.details.todays_date);
		   			setStorage("kr_todays_date_raw", data.details.todays_date_raw);
		   			setStorage("kr_token", data.details.token);
		   			
		   			setStorage("kr_location_accuracy", data.details.location_accuracy);
		   					   			
		   			setStorage("kr_on_duty", data.details.on_duty);
		   				   			
		   			setStorage("topic_new_task", data.details.topic_new_task);
		   			setStorage("topic_alert", data.details.topic_alert);
		   					   			
		   			initSubscribe(data.details.enabled_push);
		   					   			
					/*kNavigator.resetToPage("home.html", {
					   animation: 'slide',					  
					});*/
					checkAccessBgLocation('access_bg_location_permission.html','home.html' , false );
		   			break;
		   			
		   			case "ChangeDutyStatus":
		   			  if ( data.details==1){
		   			     $(".duty_status").html( getTrans("On-Duty",'on_duty') );
		   			  } else {
		   			  	 $(".duty_status").html( getTrans("Off-duty",'off_duty')  );
		   			  }
		   			break;
		   			
		   			case "getTaskByDate":
			   			$(".no-task-wrap").hide();
			   			$("#task-wrapper").show();
			   			dump( 'fill task' );
			   			if(!empty(data.details.data)){
			   			   $("#task-wrapper").html( formatTask( data.details.data ) );  
			   			} else {
			   			   $("#task-wrapper").html( formatTask( data.details ) );  
			   			}
			   			
			   			hide_total = getStorage("hide_total");
			   			if(hide_total!=1){		   			
			   			   $(".total_order_total").html(data.msg);
			   			}
		   					   			
	                   if(!empty(data.details.todays_date)){
		   			      kr_todays_date = data.details.todays_date;
		   			   } else {
		   			  	  kr_todays_date = getStorage("kr_todays_date");
		   			   }
				       if(!empty(kr_todays_date)){
				         $(".todays_date").html( kr_todays_date );
				       } else {
				      	 $(".todays_date").html( '' );
				       }
		   			 			
		   			break;
		   			
		   			case "TaskDetails":
		   			$(".toolbar-title").html ( data.msg ) ;
		   			$(".task_id_details").val( data.details.task_id );
		   			
		   			setStorage("task_full_data",JSON.stringify(data.details));
		   			
		   			$("#task-details").html( 
		   			   formatTaskDetails(data.details) + 	  // customer details   			   
		   			   TaskDetailsChevron_1(data.details)  +  // delivery address
		   			   TaskDetailsChevron_4(data.details)  +  // merchant address
		   			   TaskDetailsChevron_2(data.details) +   // task description
		   			   OrderDetails(data.details) +           // order details
		   			   TaskAddSignature( data.details ) +	  // task signature
		   			   DriverNotes( data.history_notes , data.details ) +	// driver notes	   			   
		   			   addPhotoChevron(data.details) +  // take picture
		   			   TaskDetailsChevron_3(data.details.history)  +  // task history		   			   
		   			   '<div style="height:100px;"></div>'
		   			);
		   			
		   			//show signature
		   			
		   			$("#task-action-wrap").html( 
		   			  swicthButtonAction( data.details.task_id, data.details.status_raw )
		   			);
		   			
		   			$(".task_id_global").val( data.details.task_id );
		   			
		   			setStorage("enabled_resize_photo",data.details.enabled_resize_photo);
		   			setStorage("photo_resize_width",data.details.photo_resize_width);
		   			setStorage("photo_resize_height",data.details.photo_resize_height);
		   			
		   			setStorage("map_icons", JSON.stringify(data.details.map_icons) );
		   			
		   			break;
		   			
		   			case "viewTaskDescription":
		   			$(".toolbar-title").html ( data.msg ) ;
		   			$("#task-description").html( taskDescription(data.details) );
		   			break;
		   			
		   			
		   			case "changeTaskStatus":
		   			
		   			  reload_home=1;
		   			  if ( data.details.reload_functions =="TaskDetails"){
		   			  	   callAjax("TaskDetails",'task_id=' + data.details.task_id );		   			  	   
		   			  }
		   			  
		   			  if ( data.details.reload_functions=="getTodayTask"){
		   			  	   kNavigator.popPage().then(function() {
		   			  	   	   //
						   })
		   			  }
		   			  
		   			  $("#task-action-wrap").html( 
		   			     swicthButtonAction( data.details.task_id, data.details.status_raw )
		   			  );
		   			  
		   			break;
		   			
		   			case "AddSignatureToTask":
		   			    kNavigator.popPage().then(function() {							
		   			    	callAjax("TaskDetails",'task_id=' + data.details );
				        });		   			    
		   			break;
		   			
		   			
		   			case "GetProfile":
		   					   			
		   			setTimeout(function(){ 
		   						   				
			   			$(".driver-fullname").html( data.details.full_name );
			   			$(".team-name").html( data.details.team_name );
			   			$(".driver-email").html( data.details.email );
			   			$(".phone").val( data.details.phone );			   			
	  	 		 		  	 		    
			   			$(".transport_type_id2").html( data.details.transport_type_id2 );
			   			$(".transport_description").val( data.details.transport_description );
			   			$(".licence_plate").val( data.details.licence_plate );
			   			$(".color").val( data.details.color );
			   			
			   			$(".transport_type_id").val( data.details.transport_type_id );
			   			switchTransportFields( data.details.transport_type_id );
			   			
			   			if ( !empty(data.details.profile_photo)){
			   				$(".profile-bg").css('background-image', 'url(' + data.details.profile_photo + ')');
			   				$(".profile-bg").css("background-size","cover");
			   				$(".avatar").attr("src", data.details.profile_photo );
			   				imageLoaded('.img_loader');
			   			} else {
			   				imageLoaded('.img_loader');
			   			}
			   			
			   			fillTransportList(data.details.transport_list, data.details.transport_type_id );
		   			
		   			}, 1000);
		   			
		   			break;
		   			
		   			
		   			case "GetTransport":
		   			  /*var html='<ons-list>';
		   			  x=1;	   			 
		   			  $.each( data.details, function( key, val ) { 		   			  	  
		   			  	  html+=OptionListTransport('transport_type', key, val , x);
		   			  	  x++;
		   			  });
		   			  html+='</ons-list>';
		   			  $("#transport-list").html(  html );*/
		   			  fillTransportList(data.details);		
		   			break;
		   			
		   			case "ProfileChangePassword":
		   			  setStorage("kr_password", data.details);
		   			  onsenAlert( data.msg );   
		   			break;
		   			
		   			//silent		   			
		   			case "DeviceConnected":		   			
		   			break;
		   			
		   			case "SettingPush":		   			  
		   			  initSubscribe( data.details.enabled_push );
		   			  showToast( getTrans("Setting saved","setting_saved") ,'success')
		   			break;
		   			
		   			case "GetSettings":
		   			  
		   			  if ( data.details.enabled_push==1){
		   			      enabled_push.checked=true;
		   			  } else {
		   			  	  enabled_push.checked=false;
		   			  }
		   			  
		   			  kr_lang_id=getStorage("kr_lang_id");
		   			  if(!empty(kr_lang_id)){
		   			  	  $(".language_selected").html( data.details.language[kr_lang_id] );
		   			  }
		   			  
		   			break;
		   			
		   			case "LanguageList":
		   			 $("#language-list").html('');
		   			 var html='';
		   			  x=1;	   			 
		   			  $.each( data.details, function( key, val ) { 		   			  	  
		   			  	  //html+=OptionListLanguage('lang_id', val.lang_id, val.language_code , x);
		   			  	  html+=OptionListLanguage('lang_id', val, val , x);
		   			  	  x++;
		   			  });
		   			  $("#language-list").html(  html );
		   			break;
		   			
		   			case "GetAppSettings":
		   			   dump('GetAppSettings');		 	
		   			   
		   			   if (!empty(data.details.admin_country_set)){
		   			   	   setStorage("mobile_country_code",data.details.admin_country_set);
		   			   } else {
		   			   	   removeStorage("mobile_country_code");
		   			   }	   			   
		   			   		   			   
		   			   setStorage("kr_translation",JSON.stringify(data.details.translation));
		   			   
		   			   //set sounds url
		   			   setStorage("notification_sound_url",data.details.notification_sound_url);		   			   
		   			   setStorage("enabled_signup",data.details.enabled_signup);		   			   
		   			   setStorage("vibrate_interval",data.details.vibrate_interval);
		   			   
		   			   /*tracking*/		   			   
		   			   setStorage("record_track_Location",data.details.record_track_Location);
		   			   setStorage("disabled_tracking_bg",data.details.disabled_tracking_bg);
		   			   setStorage("track_interval",data.details.track_interval);		   			   
		   			   		   			   
		   			   setStorage("app_name",data.details.app_name);
		   			   setStorage("map_provider",data.details.map_provider);
		   			   setStorage("hide_total",data.details.hide_total);
		   			   
		   			   setStorage("background_message", JSON.stringify(data.details.background_message) );
		   			   setStorage("privacy_policy_link", data.details.privacy_policy_link );
		   			   
		   			   // set the language id
		   			   if ( !empty(data.details.app_language)){
		   			   	      setStorage("kr_lang_id",data.details.app_language);  
		   			   } else {
			   			   if ( empty( getStorage("kr_lang_id") )){
			   			   	  setStorage("kr_lang_id","");  
			   			   } 
		   			   }
		   			   		  
		   			   if(data.details.valid_token==1){
		   			   	 setStorage("kr_todays_date", data.details.todays_date);
						 setStorage("kr_todays_date_raw", data.details.todays_date_raw);
						 setStorage("kr_token", data.details.token);
						 setStorage("kr_location_accuracy", data.details.location_accuracy);
						 setStorage("kr_on_duty", data.details.on_duty);
						 setStorage("topic_new_task", data.details.topic_new_task);
                         setStorage("topic_alert", data.details.topic_alert);

                         initSubscribe(data.details.enabled_push);
                         
                         /*kNavigator.resetToPage("home.html", {
						   animation: 'slide',					  
						 });*/
                         checkAccessBgLocation('access_bg_location_permission.html','home.html' , true);

		   			   } else {
		   			   	  kNavigator.resetToPage("pagelogin.html", {
							  animation: 'fade',
							  callback: function(){						  	  
							  } 
						  });
		   			   }
	                   
		   			break;
		   			
		   			case "ViewOrderDetails":
		   			$("#order-details").html( formatOrderDetails( data.details , data.msg ) );
		   			break;
		   			
		   			case "GetNotifications":		   			
		   			$("#notifications-details").html( formatNotifications( data.details ) );
		   			clearPushCount();
		   			break;
		   			
		   			
		   			case "clearNofications":
		   			$("#notifications-details").html('');	
		   			clearPushCount();
		   			break;
		   			
		   			case "Logout":
		   			  removeStorage('kr_token');		   			  
		   			break;
		   					   					   			
		   			case "loadNotes":		   			
		   			  fillNotes(data);
		   			break;
		   			
		   			case "addNotes":		   			
		   			  $(".notes_fields").val('');
		   			  callAjax("loadNotes","task_id="+ data.details.task_id );		 
		   			break;
		   			
		   			case "deleteNotes":		   			
		   			  notes_popover.hide();
		   			  callAjax("loadNotes","task_id="+ data.details.task_id );		 		   			  		   			  
		   			break;
		   			
		   			case "updateNotes":   			   			  
		   			  var dialog_notes = document.getElementById('editNotes');
		   			  dialog_notes.hide();
		   			  callAjax("loadNotes","task_id="+ data.details.task_id );		 		   			  		   			  
		   			break;
		   			
		   			case "trackDistance":
		   			  showDistanceInfo(data.details);
		   			break;
		   			
		   			case "signup":
		   			  onsenAlert( data.msg );
		   			  kNavigator.popPage({cancelIfRunning: true}); 
		   			break;
		   			
		   			case "UploadTaskPhoto":
		   			var dialog = document.getElementById('addphotoSelection');
	                dialog.hide();	    
	                
	                callAjax("TaskDetails",'task_id=' + $(".task_id_details").val() );
	                            
		   			break;
		   			
		   			
		   			case "getTaskPhoto":
		   			  gridPhoto(data , data.msg);
		   			break;
		   			
		   			case "deletePhoto":
		   			   callAjax('getTaskPhoto', 'task_id='+$(".task_id_details").val() );
		   			break;
		   			
		   			case "loadSignature":
		   			  if (data.details.status=="successful"){
		   			  	 $(".toolbar-title-signature").html( getTrans("View Signature",'view_signature') );
	  	 	             $(".signature-action").hide();
	  	 	             if (!empty(data.details.data)){
	  	 	             	
	  	 	             	 signature_html='<div class="img_loaded" >';
				  	 	     signature_html += '<img src="'+data.details.data.customer_signature_url+'" />';
				  	 	     signature_html+='</div>';
				  	 	   
				  	 	     $("#signature-pan").html ( signature_html )  ;
				  	 	   
				  	 	     imageLoaded('.img_loaded');
				  	 	     
				  	 	     $(".recipient_name").hide();
	  	 	             }
		   			  } else {
		   			  	
		   			  	 $(".toolbar-title-signature").html( getTrans("Add Signature",'add_signature') );
	  	 	             $(".signature-action").show();	
	  	 	             $(".recipient_name").show();  	 	               
	  	 	             $sigdiv = $("#signature-pan") ;	  	 	           

	  	 	             if(!empty(data.details.data.receive_by)){
		   			       $(".recipient_name").val( data.details.data.receive_by );		   			     
	  	 	             }
		   			     if (!empty(data.details.data)){
		   			     	 $(".signature_id").val( data.details.data.id );
		   			     	 dump(data.details.data.signature_base30);		   			     	 
	  	 	                 $sigdiv.jSignature("setData", "data:"+data.details.data.signature_base30 ) ;	  	 	                 
		   			     }
		   			  }
		   			break;
		   			
		   			case "getTaskCompleted":
		   			  
		   			  pullHookCompleted();
		   			
		   			  if(!empty(data.details.data)){
		   			  	$("#completed_task_list #task_completed").html( formatTask( data.details.data ) ); 
		   			  } else {
		   			  	$("#completed_task_list #task_completed").html( formatTask( data.details ) ); 
		   			  }		   			  
		   			  
		   			  hide_total = getStorage("hide_total");
		   			  if(hide_total!=1){
		   			     $(".total_order_total2").html(data.msg);
		   			  }
		   			  
		   			  if(!empty(data.details.todays_date)){
		   			     kr_todays_date = data.details.todays_date;
		   			  } else {
		   			  	 kr_todays_date = getStorage("kr_todays_date");
		   			  }
				      if(!empty(kr_todays_date)){
				        $(".todays_date2").html( kr_todays_date );
				      } else {
				      	$(".todays_date2").html( '' );
				      }
		   			break;
		   					   					   			
		   			default:
		   			  showToast( data.msg ,'success' );
		   			break;
		   		}
    		
    	} else {
    		/*FAILED MYCALL*/
    		
    		switch (action)
		   		{
		   			case "TaskDetails":
		   			  toastMsg( data.msg );
		   			  reload_home=1;
		   			break
		   			
		   			case "getTaskCompleted":
		   			
		   			  pullHookCompleted();
		   			  
		   			  
		   			  $("#completed_task_list #task_completed").html( '' );  
		   			  $(".total_order_total2").html('');
		   			  		   			  
		   			  if(!empty(data.details.todays_date)){
		   			     kr_todays_date = data.details.todays_date;
		   			  } else {
		   			  	 kr_todays_date = getStorage("kr_todays_date");
		   			  }
				      if(!empty(kr_todays_date)){
				        $(".todays_date2").html( kr_todays_date );
				      } else {
				      	$(".todays_date2").html( '' );
				      }
		   			break;
		   			
		   			case "loadNotes":
		   			$("#list-notes").html('');
		   			break;
		   					   					   			
		   			case "getTaskByDate":		  		   			  
		   			  $(".no-task-wrap").show();
		   			  $(".no-task-wrap p").html( data.msg );
		   			  		   			  
		   			  $("#pending_task_list #task-wrapper").html('');
		   			  $(".total_order_total").html('');
		   			  
		   			  showToast( data.msg ,'danger' );
		   			  		   			  
                      if(!empty(data.details.todays_date)){
		   			     kr_todays_date = data.details.todays_date;
		   			  } else {
		   			  	 kr_todays_date = getStorage("kr_todays_date");
		   			  }
				      if(!empty(kr_todays_date)){
				        $(".todays_date").html( kr_todays_date );
				      } else {
				      	$(".todays_date").html( '' );
				      }
		   			  
		   			break;

		   			case "login":
		   					   			
		   			//checkGPS();		   			   		
		   			$("#frm-login").show();
			        $(".login-header").show();
			        $(".auto-login-wrap").hide();
		   			onsenAlert( data.msg );
		   			removeStorage("kr_remember");
		   			break;
		   			
		   			//silent		   			
		   			case "SettingPush":		   			
		   			case "DeviceConnected":
		   			case "Logout":
		   			break;
		   					   			
		   			case "GetNotifications":
		   			clearPushCount();
		   			toastMsg( data.msg );
		   			$(".clear_notification_wrap").hide();
		   			break;
		   			
		   			case "getTaskPhoto":
		   			  $("#list-photos").html('');
		   			break;
		   			
		   			case "trackDistance":
		   			toastMsg( data.msg );
		   			break;
		   				
		   			case "loadSignature":
		   			 $(".toolbar-title-signature").html( getTrans("Add Signature",'add_signature') );
	  	 	         $(".signature-action").show();
	  	 	         $("#signature-pan").jSignature();	
		   			break;
		   			
		   			default:		   					   			  
		   			  showToast( data.msg ,'danger' );
		   			break;
		   		}
    		
    		
    	} /*END CODE */
    });
    /*END DONE AJAX*/
    
     /*ALWAYS*/
    ajax_request[timenow].always(function() {
        dump("ajax always");
        hideAllModal();	
        clearTimeout( timer[timenow] );
        ajax_request[timenow]=null;          
    });
          
    /*FAIL*/
    ajax_request[timenow].fail(function( jqXHR, textStatus ) {   
    	clearTimeout( timer[timenow] ); 	
    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
    	if(textStatus!="abort"){
    	   showToast( textStatus + "\n" + $text );             
    	}
    });     
    
    
   } catch(err) {
      showToast(err.message);
   } 
	
}

function AjaxTask(action, params , done)
{
	try {
	dump('AjaxTask =>' + action);	
	params+=getParams();			
	
    ajax_task = $.ajax({
	  url: ajax_url+"/"+action,
	  method: "post" ,
	  data: params ,
	  dataType: "json",
	  timeout: ajax_timeout,
	  crossDomain: true,
	  beforeSend: function( xhr ) {
	  	
	  	 clearTimeout( timer[100] ); 
	  	
         if(ajax_task != null) {			 				   		   
           ajax_task.abort();
		 } else {   		 			
		 	timer[100] = setTimeout(function() {		
         		if( ajax_task != null) {		
				   ajax_task.abort();				   
         		}         		         		
	        }, ajax_timeout ); 		 	
		 }
      }
    });
	
    ajax_task.done(function( data ) {
    	if(!empty(done)){
    	   done();
    	}
    	
    	$target = action=="GetTaskByDate"?"task-wrapper":"task_completed";
    	dump($target);
    	
    	if ( data.code==1){	    	
    		if(!empty(data.details.data)){
   			   $("#"+ $target).html( formatTask( data.details.data ) );  	   			   
   			} else {
   			   $("#"+ $target).html( formatTask( data.details ) );  
   			}		    			
		} else {				   			
			$("#"+ $target).html(''); 
			showToast( data.msg ,'danger');			
		}
    });
	
	ajax_task.always(function() {        
        ajax_task = null;  
    });	   
    
    ajax_task.fail(function( jqXHR, textStatus ) {    	    	
    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
		if(textStatus!="abort"){
		   showToast( textStatus + "\n" + $text );             
		}    	
    });     
	
    } catch(err) {
      showToast(err.message);
    } 	
}


function onsenAlert(message,dialog_title)
{
	if (typeof dialog_title === "undefined" || dialog_title==null || dialog_title=="" ) { 
		dialog_title=dialog_title_default;
	}
	ons.notification.alert({
      message: message,
      title:dialog_title
    });
}

function toastMsg( message )
{		
	showToast(message);
}

showToast = function(data, modifier) {

  if (empty(data)){
  	  data=' ';
  }	  
  if (empty(modifier)){
  	  modifier=' ';
  }	  
  is_animation = '';
  
  if(modifier=="danger"){
  	is_animation='fall';
  }
  
  toast_handler  = ons.notification.toast(data, {
     timeout: 2500, //
     animation: is_animation ,
     modifier: modifier+ ' thick',
  });
   
};


function hideAllModal()
{	
	setTimeout('loader.hide()', 1);
}

function login() {	
	var params = $( ".frm").serialize();
	params+="&device_id="+ getStorage("device_id");
	params+="&device_platform="+ device_platform;
	dump(params);	
	callAjax("login",params);
}

function forgotPass()
{
	dump('forgotPass');
	var params = $( "#frm-forgotpass").serialize();
	dump(params);
	callAjax("ForgotPassword",params);
}

var xx=0;
var lastUpdateTime,
minFrequency = 8000;

function getCurrentPosition()
{	 
	 
	 watchID = navigator.geolocation.watchPosition( function(position) {	 
	 
	     var now = new Date();
	     	     
	     var now = new Date();
	    	    
	     if(!empty(app_running_status)){
		     if (app_running_status=="background"){
		     	 return;
		     }
	     }
	     	     
	     params = 'lat='+ position.coords.latitude + "&lng=" + position.coords.longitude;	     
	     params+="&app_version=" + app_version;
	     
	     params+="&altitude="+ position.coords.altitude;
	     params+="&accuracy="+ position.coords.accuracy;
	     params+="&altitudeAccuracy="+ !empty(position.coords.altitudeAccuracy)?position.coords.altitudeAccuracy:'' ;
	     params+="&heading="+ !empty(position.coords.heading)?position.coords.heading:'';
	     params+="&speed="+ !empty(position.coords.speed)?position.coords.speed:'';
	     params+="&track_type=active";
	     	
	     dump('watch position');
	     
	     callAjax2('updateDriverLocation', params);
	     
	 },function(error) {
	 	 dump('error position');
	 	 navigator.geolocation.clearWatch(watchID);
	 },
	   { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
	 );	 	 
}

var showChangePassword = function() {
  var dialog = document.getElementById('dialogChangePass');
  if (dialog) {
      dialog.show();
  } else {
    ons.createDialog('changePassword.html')
      .then(function(dialog) {
        dialog.show();       
        setTimeout('TransLatePage()', 300);	
    });
  }
};

function changePassword()
{
	var params = $( "#frm-changepass").serialize();
	callAjax("ChangePassword",params);
}

var onduty_handle=0;

function changeDuty()
{		
	onduty_handle++;
	dump(onduty_handle);
	var onduty = document.getElementById('onduty').checked==true?1:2 ;	
	params="onduty="+onduty;
	//if ( onduty_handle==2){
	   callAjax("ChangeDutyStatus",params);
	   onduty_handle=0;
	//}
	if ( onduty==2){				
		stopCron();
	} else {
		checkGPS();
	}
}

var showMenu = function(element) {   
   popover.show(element);
};

function getTodayTask(raw_date)
{
   if (empty(raw_date)){
   	   raw_date=getStorage('kr_todays_date_raw');
   }
   callAjax("getTaskByDate","date="+raw_date);
}

function showTask(task_id)
{
   dump(task_id);	
   reload_home=2;
      
   kNavigator.pushPage("taskDetails.html", {
	  animation: 'slide',
	  data : { 					  	  
  	    'task_id': task_id,  	    
  	 }	  
   });
}

function viewTaskDescription(task_id)
{	
	kNavigator.pushPage("viewTaskDescription.html", {
	  animation: 'none',
	  callback: function(){		 					  	  
	  	callAjax("viewTaskDescription",'task_id=' + task_id);
	  } 
   });
}

function swicthButtonAction( task_id, status_raw )
{
	dump(status_raw);
	var html=''; var action='';
	switch (status_raw)
	{
		case "assigned":
		case "unassigned":
		case "pending":
		case "accepted":
		action='acknowledged';
		html+='<p><ons-button modifier="large"';
		html+='onclick="changeTaskStatus('+task_id+','+ "'"+action+"'" +' )" > '+ getTrans("Accept",'accept') +' </ons-button></p>';
		
		action='declined';
		html+='<p><ons-button modifier="quiet"';
		html+='onclick="declinedTask('+task_id+','+ "'"+action+"'" +' )" >'+ getTrans("Decline",'decline') +'</ons-button></p>';
		break;
		
		case "acknowledged":
		action='started';
		html+='<p><ons-button modifier="large"';
		html+='onclick="changeTaskStatus('+task_id+','+ "'"+action+"'" +' )" >'+ getTrans('Start','start') +'</ons-button></p>';
		
		action='cancelled';
		html+='<p><ons-button modifier="quiet"';
		html+='onclick="ShowAddReason('+task_id+','+ "'"+action+"'" +' )" >'+ getTrans('Cancel','cancel') +'</ons-button></p>';
		break;
		
		case "started":
		action='inprogress';
		html+='<p><ons-button modifier="large"';
		html+='onclick="changeTaskStatus('+task_id+','+ "'"+action+"'" +' )" >'+getTrans('Arrived','arrived')+'</ons-button></p>';
		
		action='cancelled';
		html+='<p><ons-button modifier="quiet"';
		html+='onclick="ShowAddReason('+task_id+','+ "'"+action+"'" +' )" >'+getTrans('Cancel','cancel')+'</ons-button></p>';
		break;
		
		case "inprogress":
		action='successful';
		html+='<p><ons-button modifier="large"';
		html+='onclick="changeTaskStatus('+task_id+','+ "'"+action+"'" +' )" >'+getTrans('Successful','successful')+'</ons-button></p>';
		
		action='failed';
		html+='<p><ons-button modifier="quiet"';
		html+='onclick="ShowAddReason('+task_id+','+ "'"+action+"'" +' )" >'+getTrans('Failed','failed')+'</ons-button></p>';
		break;
		
		case "successful":
		break;
		
		case "failed":
		break;
		
		case "declined":
		break;
		
		case "cancelled":
		break;
		
		default:
		break;
	}
	return html ;	
}

function changeTaskStatus(task_id, status_raw )
{
	dump(task_id );
	dump(status_raw);		
	callAjax("changeTaskStatus",'task_id=' + task_id +"&status_raw="+status_raw ) ;
}

function reloadHome()
{
	dump('reloadHome');
	dump(reload_home);
	if ( reload_home==1){	   
	   getTodayTask('');
	   reload_home=2;
	   	   
       setTimeout(function() {
  	      raw_date=getStorage('kr_todays_date_raw');
          callAjax("getTaskCompleted","date="+raw_date +"&task_type=completed" );
       }, 3000 ); 		
	   
	}
}

function ShowAddReason(task_id , status_raw)
{
	dump(task_id);
	dump(status_raw);
	
	var dialog = document.getElementById('reasonTask');
	if (dialog) {
	      dialog.show();	      
	      $("#reason_task_id").val( task_id );
	      $("#reason_status_raw").val( status_raw );
	} else {
	    ons.createDialog('reasonTask.html')
	      .then(function(dialog) {
	        dialog.show();	        
	        $("#reason_task_id").val( task_id );
	        $("#reason_status_raw").val( status_raw );
	        setTimeout('TransLatePage()', 300);	
	    });
	}	
}

function declinedTask( task_id , status_raw )
{
	/*dump(task_id);
	dump(status_raw);
	dump(dialog_title_default);
	dump( getTrans("Are you sure?","are_you_sure") );	*/
	
	ons.notification.confirm({
		title:dialog_title_default,
		message:  getTrans("Are you sure?","are_you_sure"),
		buttonLabels: [ getTrans('No',"no"), getTrans('Yes','yes') ],
	})
	.then(
      function(answer) {
        if (answer === 1) {
           dump('ok');
           callAjax("changeTaskStatus",'task_id=' + task_id +"&status_raw="+status_raw ) ;
        }
      }
    );
}

function AddReasonTask()
{	
	if ( $("#reason").val()==""){
		onsenAlert( t("reason_is_required","Reason is required") );
		return;
	}
	var task_id=$("#reason_task_id").val();
	var status_raw=$("#reason_status_raw").val();
	reasonTask.hide();
	callAjax("changeTaskStatus",'task_id=' + task_id +"&status_raw="+status_raw + "&reason="+ $("#reason").val() ) ;
}

function ShowSignaturePage( task_id , signature , status , recipient_name )
{	
	kNavigator.pushPage("Signature.html", {
	  animation: 'none',
	  callback: function(){		 		
	  	 $(".task_id_signature").val(  task_id );	  	 
	  	 if ( status=="successful"){
	  	 	$(".toolbar-title-signature").html( getTrans("View Signature",'view_signature') );
	  	 	$(".signature-action").hide();
	  	 	if ( !empty(signature)){	  	 	
	  	 		
	  	 	   signature_html='<div class="img_loaded" >';
	  	 	   signature_html += '<img src="'+signature+'" />';
	  	 	   signature_html+='</div>';
	  	 	   
	  	 	   $("#signature-pan").html ( signature_html )  ;	  	 	   
	  	 	   imageLoaded('.img_loaded');	  	 	
	  	 	   
	  	 	}
	  	 	
	  	 	if(!empty(recipient_name)){	  	 		
	  	 		$(".recipient_name").val( recipient_name );		  	 	
	  	 	}
	  	 	
	  	 } else {	  	 	  	 	
	  	 	$(".toolbar-title-signature").html( getTrans("Add Signature",'add_signature') );
	  	 	$(".signature-action").show();
	  	 	$("#signature-pan").jSignature();	  	
	  	 }	  	 	  	 
	  } 
   });
}

function resetSignature()
{
	dump('resetSignature');
	$("#signature-pan").jSignature("reset");	  	
}

function AddSignatureToTask()
{
	//var datapair = $("#signature-pan").jSignature("getData", "svgbase64");
	var datapair = $("#signature-pan").jSignature("getData","base30");	
	callAjax("AddSignatureToTask","image="+datapair +"&task_id=" + $(".task_id_signature").val() + "&recipient_name="+ $(".recipient_name").val()  + "&signature_id="+ $(".signature_id").val()  );
}

function imageLoaded(div_id)
{	
	$(div_id).imagesLoaded()
	  .always( function( instance ) {
	    console.log('all images loaded');
	  })
	  .done( function( instance ) {
	    console.log('all images successfully loaded');
	  })
	  .fail( function() {
	    console.log('all images loaded, at least one is broken');
	  })
	  .progress( function( instance, image ) {
	    var result = image.isLoaded ? 'loaded' : 'broken';	    	   
	    image.img.parentNode.className = image.isLoaded ? '' : 'is-broken';
	    console.log( 'image is ' + result + ' for ' + image.img.src );	    
	});
}

function showCalendarView()
{
	kNavigator.pushPage("CalendarView.html", {
	  animation: 'slide',
	  callback: function(){		 					  	  
	  	  dump('CalendarView');		  
	  } 
   });
}

function showTransportType()
{
   var dialog = document.getElementById('transporType');
   if (dialog) {
      dialog.show();
   } else {
      ons.createDialog('transporType.html')
      .then(function(dialog) {
      	callAjax("GetTransport",'');
        dialog.show();
      });
   }   
}

function setTransportType(key , val)
{	
	dump(key); dump(val);
	transporType.hide();
	$(".transport_type_id2").html( val );
	$(".transport_type_id").val( key );
	switchTransportFields( key );
}

function switchTransportFields( transport_type )
{
	if ( transport_type=="walk" ){
		$(".with-car").hide();
	} else {
		$(".with-car").show();
	}
}

function UpdateForms(form_id , action )
{
	var params = $( "#"+form_id).serialize();	
	callAjax(action,params);
}

var switch_handle=0;

function UpdatePush()
{
	switch_handle++;
	dump('UpdatePush');
	var enabled_push = document.getElementById('enabled_push').checked==true?1:2 ;	
	params="enabled_push="+enabled_push;
	 
    callAjax("SettingPush",params);
    switch_handle=0;

}


function ShowLanguageOption()
{
   var dialog = document.getElementById('LanguageList');
   if (dialog) {
   	  callAjax("LanguageList",'');
      dialog.show();
   } else {
      ons.createDialog('LanguageList.html')
      .then(function(dialog) {
      	callAjax("LanguageList",'');
        dialog.show();
      });
   }   
}

function SetLanguage(lang_id , language)
{
	dump(lang_id);
	dump(language);
	$(".language_selected").html( language );
	setStorage("kr_lang_id",language);
	LanguageList.hide();
	TransLatePage();
	reload_home=1;
}

function Logout()
{	
	popover.hide();	
	
	ons.notification.confirm( getTrans("Are you sure you want to logout?","logout_confirm") ,{
		title: dialog_title_default,
		buttonLabels : [ getTrans("No","no") , getTrans("Yes","yes") ]
	}).then(function(input) {		
		if (input==1){
			
			removeStorage('kr_username');
			removeStorage('kr_password');
			removeStorage('kr_remember');	
							
			stopCron();
			  			    
			kNavigator.resetToPage("pagelogin.html", {
	    	 animation: 'none',
	    	 callback: function(){    	 		    	 	
	    	    callAjax("Logout",'');
	    	 }
			});
		}
	});
		
}

function TransLatePage()
{
	var dictionary;
	dump('TransLatePage');
	if (typeof getStorage("kr_translation") === "undefined" || getStorage("kr_translation")==null || getStorage("kr_translation")=="" ) { 	   		
		return;		
	} else {		
		dictionary =  JSON.parse( getStorage("kr_translation") );
	}	
	if (!empty(dictionary)){
		//dump(dictionary);
		var kr_lang_id=getStorage("kr_lang_id");		
		
		dump("kr_lang_id =>" + kr_lang_id);
		
		if (!empty(kr_lang_id)){
			//dump(kr_lang_id);
			translator = translator = $('body').translate({lang: kr_lang_id, t: dictionary});
			//translateForms();
			//translateTabs();
		}
	} else {
		dump("empty language file")
	}
}

function translateForms()
{
	dump('translateForms()');
	var t='';
	$.each( $(".field-wrap") , function() { 				
		var temp_value=$(this).find("input.text-input").attr("placeholder");		
		//dump("->"+temp_value);
		if(!empty(temp_value)){
			key = $(this).find("ons-input").data("trn-key");			
		    t = getTrans(temp_value, key );		    
		    $(this).find("input.text-input").attr("placeholder",t);
		    $(this).find("._helper").html(t);	
		    $(this).find(".text-input__label").html(t);	    
		}
	});	
}

function translateTabs()
{
	return;
	var t='';
	$.each( $(".tab-bar__item") , function() { 				
		var temp_value=$(this).find(".tab-bar__label").html();		
		if(!empty(temp_value)){		
			key = $(this).data("trn-key");							
			t = getTrans(temp_value, key );		    
		    $(this).find(".tab-bar__label").html(t);    
		}
	});	
}

function getTrans(words,words_key)
{
	var temp_dictionary='';		
	
	if (typeof getStorage("kr_translation") === "undefined" || getStorage("kr_translation")==null || getStorage("kr_translation")=="" ) { 	   
		return words;
	} else {
		temp_dictionary =  JSON.parse( getStorage("kr_translation") );
	}	
		
	if (!empty(temp_dictionary)){
		//dump(temp_dictionary);		
		var default_lang=getStorage("kr_lang_id");
		//dump(default_lang);
		if (default_lang!="undefined" && default_lang!=""){
			//dump("OK");
			if ( array_key_exists(words_key,temp_dictionary) ){
				//dump('found=>' + words_key +"=>"+ temp_dictionary[words_key][default_lang]);				
				if(!empty(temp_dictionary[words_key][default_lang])){
				   return temp_dictionary[words_key][default_lang];
				} 
			} 
		}
	}	
		
	return words;
}

function array_key_exists(key, search) {  
  if (!search || (search.constructor !== Array && search.constructor !== Object)) {
    return false;
  }
  return key in search;
}

function isAutoLogin()
{
   var auto_login=2;
   var kr_remember = getStorage("kr_remember");	
   if ( kr_remember=="on"){
   	   var kr_username=getStorage("kr_username");
       var kr_password=getStorage("kr_password");
       var kr_remember=getStorage("kr_remember");
       if (!empty(kr_username) && !empty(kr_password)){
       	    auto_login=1;
       }
   } 
   return auto_login;
}

function ShowOrderDetails( order_id )
{
	kNavigator.pushPage("OrderDetails.html", {
	 animation: 'slide',
	 data : { 
	 	'order_id': order_id,  	  
	 }	  
   });
}

var watch_count=1;

var onSuccess = function(position) {
	var html='';
	html='Lat : '+position.coords.latitude;
	html+='<br/>';
	html+= watch_count++;
	html+='<br/>';
	html+='Lat : '+position.coords.longitude;
	$(".location-res").html( html );
};

function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

function checkGPS()
{					 
	 if (isDebug()){	 	
		return ;
	 }	 
	 	 
	 if(cordova.platformId === "ios"){
	 	return false;
	 }	 
	 
	 cordova.plugins.diagnostic.isLocationAuthorized(function(authorized){	 		
 		if(authorized){
 		   cordova.plugins.locationAccuracy.request( onRequestSuccess, 
           onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
 		} else {
 			 			 
 			 cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
			    switch(status){
			        case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
			            toastMsg( getTrans("Permission not requested",'permission_not_requested') );
			            return;
			            break;
			        case cordova.plugins.diagnostic.permissionStatus.DENIED:
			            toastMsg( getTrans("Permission denied",'permission_denied') );
			            return;
			            break;
			        case cordova.plugins.diagnostic.permissionStatus.GRANTED:
			            //toastMsg("Permission granted always");		 
			            			            
			            cordova.plugins.locationAccuracy.request( onRequestSuccess, 
                        onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
			                       
			            break;
			        case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
			            //toastMsg("Permission granted only when in use");		            		            
			            
			            cordova.plugins.locationAccuracy.request( onRequestSuccess, 
                        onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
		                
			            break;
			    }
			}, function(error){
			    toastMsg(error);
			    return;
			}, cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);				
 				
 		}	 		
 	}, function(error){
	   toastMsg("The following error occurred: "+error);
	});
}

function onRequestSuccess(success){        
    //   
}

function onRequestFailure(error){
    //alert("Accuracy request failed: error code="+error.code+"; error message="+error.message);    
    if(error.code == 4){
    	toastMsg( getTrans("You have choosen not to turn on location accuracy",'turn_off_location') );
    	checkGPS();
    } else {
    	toastMsg( error.message );
    }
}

/*function toastOnSuccess()
{
}
function toastOnError()
{
}*/

function viewTaskMap(task_id , task_lat, task_lng , delivery_address )
{	
	/*kNavigator.pushPage("Map.html", {
		  animation: 'fade',
		  data : { 					  	  
  	        'task_id': task_id,  	  
  	        'task_lat' : task_lat ,
  	        'task_lng' : task_lng ,
  	        'delivery_address' : delivery_address
  	      }	  		
	 });*/
}


function viewTaskMapInit()
{
	var task_lat=getStorage('task_lat');
	var task_lng=getStorage('task_lng');
	dump(task_lng);
	dump(task_lat);
	dump(getStorage("delivery_address"));

	if (isDebug()){
		return;
	}
	
	google_lat = new plugin.google.maps.LatLng( task_lat , task_lng );
	
	/*
    var div = document.getElementById("map_canvas");  
    map = plugin.google.maps.Map.getMap(div,{     
     'camera': {
      'latLng': google_lat,
      'zoom': 17
     }
    });      
    map.on(plugin.google.maps.event.MAP_READY, onMapInit); 
    */
	
	//$('.page__background').not('.page--menu-page__background').css('background-color', 'rgba(0,0,0,0)');	 
	
	setTimeout(function(){ 	    
        var div = document.getElementById("map_canvas");
        $('#map_canvas').css('height', $(window).height() - $('#map_canvas').offset().top);
        
        map = plugin.google.maps.Map.getMap(div, {     
	     'camera': {
	      'latLng': google_lat,
	      'zoom': 17
	     }
	    });
	    
	    
	    map.clear();
		map.off();
				
		map.setCenter(google_lat);             
		map.setZoom(17);
		
        map.setBackgroundColor('white');
        
        map.on(plugin.google.maps.event.MAP_READY, onMapInit); 
        
    }, 300); // and timeout for clear transitions        
}

function onMapInit()
{			
	/*map.clear();
	map.showDialog();*/
	map.clear();	
	var task_lat=getStorage('task_lat');
	var task_lng=getStorage('task_lng');
	var delivery_address=getStorage('delivery_address');
	
	map.addMarker({
	  'position': new plugin.google.maps.LatLng( task_lat , task_lng ),
	  'title': delivery_address ,
	  'snippet': getTrans( "Destination" ,'destination')
     }, function(marker) {
     	
	    marker.showInfoWindow();	
	    
	    navigator.geolocation.getCurrentPosition( function(position) {	    
	    	  
	    	 var driver_location = new plugin.google.maps.LatLng(position.coords.latitude , position.coords.longitude); 	
	    	 //demo
	    	 //var driver_location = new plugin.google.maps.LatLng( 34.039413 , -118.25480649999997 ); 	
	    	 
	    	 var destination = new plugin.google.maps.LatLng( task_lat , task_lng );
	    	 
	    	  if ( iOSeleven() ){	    	  	
	    	  	   map.animateCamera({
					  'target': driver_location,
					  'zoom': 17,
					  'tilt': 30
					}, function() {
						
					   var data = [      
				          {'title': getTrans('You are here','you_are_here'), 'position': driver_location }  
				       ];
				   
					   addMarkers(data, function(markers) {
					    markers[markers.length - 1].showInfoWindow();
					   });
						
				   });  	    	  
	    	  } else {	    	
		    	  map.addPolyline({
				    points: [
				      destination,
				      driver_location
				    ],
				    'color' : '#AA00FF',
				    'width': 10,
				    'geodesic': true
				   }, function(polyline) {
				   	
				   	  map.animateCamera({
						  'target': driver_location,
						  'zoom': 17,
						  'tilt': 30
						}, function() {
							
						   var data = [      
					          {'title': getTrans('You are here','you_are_here'), 'position': driver_location }  
					       ];
					   
						   addMarkers(data, function(markers) {
						    markers[markers.length - 1].showInfoWindow();
						   });
							
					   });  
					   
				   });   
		    	 // end position success	    	 
	    	  }
	    	 
	      }, function(error){
	    	 toastMsg( error.message );
	    	 // end position error
	      }, 
          { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
        );	    	  
    });     
}

function addMarkers(data, callback) {
  var markers = [];
  function onMarkerAdded(marker) {
    markers.push(marker);
    if (markers.length === data.length) {
      callback(markers);
    }
  }
  data.forEach(function(markerOptions) {
    map.addMarker(markerOptions, onMarkerAdded);
  });
}

function viewTaskDirection()
{	
	/*plugin.google.maps.external.launchNavigation({
	  "from": "Tokyo, Japan",
	   "to": "Kyoto, Japan"
	});*/	
		
   /*var delivery_address=getStorage('delivery_address');
   dump(delivery_address);*/
      
   var task_lat=getStorage('task_lat');
   var task_lng=getStorage('task_lng');
   
   dump(task_lat); dump(task_lng);
   
   var map_action = getStorage("map_action");
   dump(map_action);
   if ( map_action=="map2"){   	   
   	   task_lat=getStorage('dropoff_lat');
       task_lng=getStorage('dropoff_lng');
   }   
	
   navigator.geolocation.getCurrentPosition( function(position) {	    
   	         
         var yourLocation = new plugin.google.maps.LatLng(position.coords.latitude , position.coords.longitude); 	        
         //demo
         //var yourLocation = new plugin.google.maps.LatLng(34.039413 , -118.25480649999997); 	        
         
         var destination_location = new plugin.google.maps.LatLng(task_lat , task_lng); 	        
         
         plugin.google.maps.external.launchNavigation({
	         "from": yourLocation,
	         "to": destination_location
	      });	

    	 // end position success    	 
      }, function(error){
    	 toastMsg( error.message );
    	 // end position error
      }, 
      { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
    );	    	  		
}

function clearPushCount()
{
	removeStorage("push_count");
	$(".baloon-notification").html('');
	$(".baloon-notification").hide();
}

function playNotification()
{
	 //var sound_url= getStorage("notification_sound_url");
	 var sound_url= "file:///android_asset/www/beep.wav";
	 dump(sound_url);
	 if(!empty(sound_url)){
        playAudio(sound_url);
	 }
}

var my_media;

function playAudio(url) {
    // Play the audio file at url    
    my_media = new Media(url,
        // success callback
        function () {
            dump("playAudio():Audio Success");
            my_media.stop();
            my_media.release();
        },
        // error callback
        function (err) {
            dump("playAudio():Audio Error: " + err);
        }
    );
    // Play audio
    my_media.play();
}

function stopNotification()
{
	my_media.stop();
    my_media.release();
}

function AjaxNotification(action, params , done)
{
	try {
	dump('AjaxNotification');
	
	params+=getParams();
		
	ajax_request3 = $.ajax({
	  url: ajax_url+"/"+action,
	  method: "post" ,
	  data: params ,
	  dataType: "json",
	  timeout: ajax_timeout,
	  crossDomain: true,
	  beforeSend: function( xhr ) {
	  	
	  	 clearTimeout( timer[101] );
	  	 
         if(ajax_request3 != null) {			 				   		   
           ajax_request3.abort();
		 } else {    				
			timer[101] = setTimeout(function() {		
         		if( ajax_request3 != null) {		
				   ajax_request3.abort();				   
         		}         		         		
	        }, ajax_timeout ); 		 	
		 }
      }
    });
    
    ajax_request3.done(function( data ) {
    	done();
    	if ( data.code==1){		
			$("#notifications-details").html( formatNotifications( data.details ) );		
		} else {		
			$("#notifications-details").html('');	
			toastMsg( data.msg );		   					
		}
    });
	
	ajax_request3.always(function() {        
        ajax_request3 = null;  
    });	   
    
    ajax_request3.fail(function( jqXHR, textStatus ) {    	
    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
		if(textStatus!="abort"){
		   showToast( textStatus + "\n" + $text );             
		}
    });     
    
    } catch(err) {
      showToast(err.message);
    } 	
	
}

function getLocationAccuracy()
{
	var location_accuracy = getStorage("kr_location_accuracy");
	if(!empty(location_accuracy)){
		if ( location_accuracy == 1){
			return true;
		}
	}
	return false;
}



function showAddNote(task_id, status_raw )
{	
	kNavigator.pushPage("Notes.html", {
	  animation: 'slide',
	  callback: function(){		 					  	  
	  	  dump('Notes');		  
	  	  $(".task_id").val(task_id);
	  	  
	  	  if ( status_raw=="cancelled" || status_raw=="successful" || status_raw=="failed"){	  	  	  
	  	  	  $(".add_notes_wrapper").hide();	  	
	  	  	  $(".toolbar-title-notes").html( getTrans("View Notes",'view_notes') );  	  
	  	  }
	  	  
	  	  callAjax("loadNotes","task_id="+task_id);
	  } 
   });
}

var showNotesPopover = function(element,id,notes) {   
   $(".notes_id").val(id);
   $(".notes_value").val(notes);
   notes_popover.show(element);  
};

function addNotes()
{
	var params = $( ".frm-notes").serialize();	
	params+="&task_id="+$(".task_id_details").val();	
	callAjax("addNotes",params);
}

function deleteNotes()
{
	notes_popover.hide();
	
	ons.notification.confirm({
	  message: getTrans("Are you sure?","are_you_sure") ,	  
	  title: dialog_title_default ,		  
	  buttonLabels: [ getTrans("Yes","yes") ,  getTrans("No","no") ],
	  animation: 'default', // or 'none'
	  primaryButtonIndex: 1,
	  cancelable: true,
	  callback: function(index) {	 	  	     	  
	  	   if (index==0){	  	   	 
				callAjax("deleteNotes","id=" + $(".notes_id").val() );
	  	   } else {
	  	   	   return false;
	  	   }
	  }
	});  	
}

function editNotes()
{
   var dialog = document.getElementById('editNotes');
   notes_popover.hide();      
   
   if (dialog) {   	  
      dialog.show();
      $(".edit_notes_fields").val( $(".notes_value").val() );
      TransLatePage();
   } else {
      ons.createDialog('editNotes.html')
      .then(function(dialog) {      	
      	$(".edit_notes_fields").val( $(".notes_value").val() );
        dialog.show();
        TransLatePage();
      });
   }   
}

function updateNotes()
{
	var params='';
	params+="id="+$(".notes_id").val();
	params+="&notes="+$(".edit_notes_fields").val();
	callAjax("updateNotes", params );
}

function view3DirectionMap(data)
{

	if(!isDebug()){
	   loader.show();
	}
	
	setStorage("map_action",'map2');
	var data = JSON.parse(getStorage("task_full_data"));
	if(!empty(data)){
		
		kNavigator.pushPage("Map.html", {
		  animation: 'fade',
		  callback: function(){		

		  	  dump(data);		
		  	  //alert(JSON.stringify(data));	 
		  	  		  	  
             if(!empty(data)){		  	  	  		  	  	  
		  	  	  if ( data.status_raw=="cancelled" || data.status_raw=="successful" || data.status_raw=="failed"){	  	  	  
		  	  	  	  $(".direction_wrap").hide();
		  	  	  	  $(".floating_action").hide();
		  	  	  }
		  	  }
		  	  
		  	  setStorage("task_lat", data.task_lat );
		  	  setStorage("task_lng", data.task_lng );
		  	  
		  	  //$(".direction_wrap").hide(); 		  	  
		  	  /*var params='';
		  	  params="driver_lat="+data.driver_lat;
		  	  params+="&driver_lng="+data.driver_lng;
		  	  params+="&dropoff_lat="+data.dropoff_lat;
		  	  params+="&dropoff_lng="+data.dropoff_lng;		  	  
		  	  params+="&task_lat="+data.task_lat;
		  	  params+="&task_lng="+data.task_lng;		  	  
		  	  callAjax("trackDistance",params);*/
		  	  

		  	  if (isDebug()){
		        return;
	          }
		  	  
		  	  var dropoff_location = new plugin.google.maps.LatLng( data.dropoff_lat , data.dropoff_lng );
		  	  var task_location = new plugin.google.maps.LatLng( data.task_lat , data.task_lng );

		  	  /*alert("dropoff "+data.dropoff_lat + " => "+ data.dropoff_lng );
		  	  alert("task location "+data.task_lat + " => "+ data.task_lng );*/
		  	  
		  	  setStorage("dropoff_lat", data.dropoff_lat );
		  	  setStorage("dropoff_lng", data.dropoff_lng );		  	  
		  	  
		  	  setTimeout(function(){ 	    
		        var div = document.getElementById("map_canvas");
		        $('#map_canvas').css('height', $(window).height() - $('#map_canvas').offset().top);
		        
		        map = plugin.google.maps.Map.getMap(div, {     
			     'camera': {
			      'latLng': dropoff_location,
			      'zoom': 17
			     }
			    });
			    
			    map.clear();
		        map.off();
			    
		        map.setBackgroundColor('white');		        
		        map.on(plugin.google.maps.event.MAP_READY, function(){
		        			        	 
		        	 
		        	 navigator.geolocation.getCurrentPosition( function(position) {	   
		        	
		        	    var driver_location = new plugin.google.maps.LatLng(position.coords.latitude , position.coords.longitude); 	
		        	    
		        	    //alert("driver_location "+position.coords.latitude + " => "+ position.coords.longitude );
		        	    
		        	    
		        	    var task_data = JSON.parse(getStorage("task_full_data"));
		        	    		        	    
		        	    /*alert(task_data.map_icons.driver);
		        	    alert(task_data.map_icons.merchant);
		        	    alert(task_data.map_icons.customer);*/
		        	    		        	    
		        	    var data_marker = [      
						{ 
					        'title': getTrans("You are here","you_are_here"),
					        'position': driver_location ,
					        //'snippet': getTrans( "Driver name" ,'driver_name'),
					        'icon': {
						       'url': task_data.map_icons.driver
						    }
					      },{ 
					        'title': data.drop_address , 							            
					        'position': dropoff_location ,
					        'snippet': getTrans( "Merchant Address" ,'merchant_address'),
					        'icon': {
						       'url': task_data.map_icons.merchant
						    }
					      },{ 
					        'title': data.delivery_address , 
					        'position': task_location ,
					        'snippet': getTrans( "Delivery Address" ,'delivery_address'),
					        'icon': {
						       'url': task_data.map_icons.customer
						    }
					      }  
					    ];
					    
					    
					   hideAllModal(); 
					    
					   map.setCenter(driver_location);             
					   map.setZoom(17);
		        	    				        					    
					   addMarkers(data_marker, function(markers) {
					    
					   	    if ( iOSeleven() ){					   	    	
					   	    	 map.animateCamera({
									  'target': dropoff_location,
									  'zoom': 17,
									  'tilt': 30
								}, function() {									
									map.animateCamera({
									  'target': task_location,
									  'zoom': 17,
									  'tilt': 30
									}, function() {
										
									}); /*end camera*/
									
					   	    	});  /*end camera*/
					   	    } else {
						   	  	map.addPolyline({
								points: [
								  driver_location,
								  dropoff_location
								],
								'color' : '#AA00FF',
								'width': 10,
								'geodesic': true
								}, function(polyline) {
								   
								   map.animateCamera({
									  'target': dropoff_location,
									  'zoom': 17,
									  'tilt': 30
									}, function() {
																		
										map.addPolyline({
										points: [
										  dropoff_location,
										  task_location
										],
										'color' : '#AA00FF',
										'width': 10,
										'geodesic': true
										}, function(polyline) {
										   
											map.animateCamera({
											  'target': task_location,
											  'zoom': 17,
											  'tilt': 30
											}, function() {
												
											}); /*end camera*/
											 
										}); /*end line*/  	
												
																   
								   });  /*end camera*/
									
								}); /*end line*/  					   	
					   	    }
					   }); /*end markers*/
					    				    
		        	 	 	
		        	 }, function(error){
		        	 	 hideAllModal();	
				    	 toastMsg( error.message );
				    	 // end position error
				      }, 
			          { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
			        );	   	
		        	
		       }); 
		        		        
		    }, 300); // and timeout for clear transitions  	  	  
		  	  	  	  
		  } 
	    });
	
	} else {
		hideAllModal();	
		onsenAlert( getTrans("Map not available",'map_not_available') );
	}
}

function trackDistance()
{
	var map_action=getStorage("map_action");
	dump("map_action+>"+map_action);
	var data = JSON.parse(getStorage("task_full_data"));
	if(!empty(data)){
	    dump(data);
	    switch (map_action)
	    {
	    	case "map2":
	    	  var params='';
		  	  params="driver_lat="+data.driver_lat;
		  	  params+="&driver_lng="+data.driver_lng;
		  	  params+="&dropoff_lat="+data.dropoff_lat;
		  	  params+="&dropoff_lng="+data.dropoff_lng;		  	  
		  	  params+="&task_lat="+data.task_lat;
		  	  params+="&task_lng="+data.task_lng;	
		  	  params+="&map_action="+map_action;	  	  
		  	  callAjax("trackDistance",params);
	    	break;
	    	
	    	case "map1":
	    	  var params='';
		  	  params="driver_lat="+data.driver_lat;
		  	  params+="&driver_lng="+data.driver_lng;
		  	  params+="&task_lat="+data.task_lat;		  	  
		  	  params+="&task_lng="+data.task_lng;		  	  
		  	  params+="&map_action="+map_action
		  	  callAjax("trackDistance",params);
	    	break;
	    	
	    	default:
	    	break;
	    }
	}
}

function showDistanceInfo(data)
{
   dump(data);
   var dialog = document.getElementById('trackDistanceDialog');
   var html='';
   if ( data.map_action=="map2"){
   	
   	   if ( data.merchant_distance!=2){
   	   	   html+='<p><b>'+getTrans("Your location to merchant",'location_to_merchant')+':</b></p>';
		   html+='<p>';
		   html+=getTrans("distance",'distance')+': '+ data.merchant_distance.distance +'<br/>';		   
		   html+= getTrans("duration",'duration')+ ': '+data.merchant_distance.duration ;
		   html+='</p>';
		   html+='<hr/>';
   	   }
   	   if ( data.delivery_distance!=2){
   	   	   html+='<p><b>'+getTrans("Merchant to customer",'merchant_to_customer')+':</b></p>';
		   html+='<p>';
		   html+=getTrans("distance",'distance')+': '+ data.delivery_distance.distance +'<br/>';		   
		   html+= getTrans("duration",'duration')+ ': '+data.delivery_distance.duration;
		   html+='</p>';		   
   	   }
   	
   } else if ( data.map_action =="map1"){   	
   	   if ( data.merchant_distance!=2){
   	   	   html+='<p><b>'+getTrans("Your location to customer",'location_to_customer')+':</b></p>';
		   html+='<p>';
		   html+=getTrans("distance",'distance')+': '+ data.merchant_distance.distance+'<br/>';
		   html+= getTrans("duration",'duration')+ ': '+data.merchant_distance.duration;
		   html+='</p>';
		   html+='<hr/>';
   	   }   
   }
   
   if (dialog) {   	  
   	  $(".distance_info").html(html);
      dialog.show();      
   } else {
      ons.createDialog('trackDistanceDialog.html')
      .then(function(dialog) {      	      	
      	$(".distance_info").html(html);
        dialog.show();
      });
   }   
}

function closeDistanceDialog()
{
	var dialog = document.getElementById('trackDistanceDialog');
	dialog.hide();
}


function initIntelInputs()
{
	 var mobile_country_code=getStorage("mobile_country_code");
	 dump("mobile_country_code=>"+mobile_country_code);
	 if(!empty(mobile_country_code)){
	 	 $(".mobile_inputs").intlTelInput({      
		    autoPlaceholder: false,		      
		    initialCountry: mobile_country_code,  
		    autoHideDialCode:false,    
		    nationalMode:false,
		    autoFormat:false,
		    utilsScript: "lib/intel/build/js/utils.js"
		 });
	 } else {
		 $(".mobile_inputs").intlTelInput({      
		    autoPlaceholder: false,		        
		    autoHideDialCode:false,    
		    nationalMode:false,
		    autoFormat:false,
		    utilsScript: "lib/intel/build/js/utils.js"
		 });
	 }	 
}

function signup()
{	
	var params = $( "#frm-signup").serialize();	
	params+="&device_platform="+ device_platform;
	callAjax("signup",params);
}

function showDeviceGallery(action_type)
{		
		
	map_navigator = 1;
	setStorage('camera_on', 1 );
	
	dump("action_type=>"+action_type);
	/*where action type
	1 = profile
	2 = task add picture	
	*/
			
	if(isDebug()){
		uploadLoader.show();
		$(".bytes_send").html("10%");		
		setTimeout(function(){
			uploadLoader.hide();
			$("#progress_bar").attr("value",0);
			$(".bytes_send").html("0%");
		 }, 3000);	
		return;
	}
	
	
	switch (action_type)
	{
		case 1:
		case "1":
		
		navigator.camera.getPicture(uploadPhoto, function(){
			toastMsg( getTrans("Get photo failed","get_photo_failed") );
			map_navigator = 0;
			setStorage('camera_on', 2 );
		},{
		    destinationType: Camera.DestinationType.FILE_URI,
		    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
		    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)
	    });
	    
	    
		break;
		
		case 2:
		case "2":
		
		var dialog = document.getElementById('addphotoSelection');
	    dialog.hide();
	    	   
	    navigator.camera.getPicture(uploadTaskPhoto, function(){
			toastMsg( getTrans("Get photo failed","get_photo_failed") );
			map_navigator = 0;
			setStorage('camera_on', 2 );
		},{
		    destinationType: Camera.DestinationType.FILE_URI,
		    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
		    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)
	    });
		
		break;
	}		
}

function uploadPhoto(imageURI)
{
	 try {
	 		 
	 map_navigator = 0;	
	 setStorage('camera_on', 2 );
	 
	 uploadLoader.show();
	 
	 setTimeout(function(){
		$("#progress_bar").attr("value",0);
		$(".bytes_send").html("5%");
	 }, 1);	
	 	 
	 var options = new FileUploadOptions();
	 options.fileKey = "file";
	 options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
	 options.mimeType = "image/jpeg";
	 	 
	 var params = {};
	 params.token = getStorage("kr_token") ;	 
	 options.params = params;
 
	 options.chunkedMode = false;	
	 
	 var headers={'headerParam':'headerValue'};
	 options.headers = headers;
	
	 var ft = new FileTransfer();	 	 	 
	 
	 ft.onprogress = function(progressEvent) {
     if (progressEvent.lengthComputable) {
     	    //toastMsg( "progressEvent=>"+progressEvent.loaded + " - " + progressEvent.total );
     	    
     	    var loaded_bytes= parseInt(progressEvent.loaded);
     	    var total_bytes= parseInt(progressEvent.total);
     	    
     	    var loaded_percent = (loaded_bytes/total_bytes)*100;	        
     	    loaded_percent=Math.ceil(loaded_percent);
     	    
	        
	        $("#progress_bar").attr("value",loaded_percent);
		    $(".bytes_send").html(loaded_percent+"%");
	        
	        if(loaded_bytes>=total_bytes){	        	        
	        	uploadLoader.hide();
	        	$("#progress_bar").attr("value",0);
		        $(".bytes_send").html("0%");
	        }
     	    
	        loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);	        
	        
	    } else {	    		    	
	        loadingStatus.increment();	        
	    }
	 };
	 	 
	 ft.upload(imageURI, ajax_url+"/UploadProfile", function(result){
	    //alert(JSON.stringify(result));
	    /*alert(result.responseCode);
	    alert(JSON.stringify(result.response));	*/
	    	    
	    
	    var response=explode("|",result.response);
	    //alert(response[0]);	
	    toastMsg(response[1]);	
	    
	    if ( response[0]=="1" || response[0]==1){
		    $(".profile-bg").css('background-image', 'url(' + response[2] + ')');
			$(".profile-bg").css("background-size","cover");
			$(".avatar").attr("src", response[2] );
			
			$("#img_loader_wrap").addClass("img_loader");
			
		    imageLoaded('.img_loader');
	    }
		
		if( $('#uploadLoader').is(':visible') ){
			uploadLoader.hide();
			$("#progress_bar").attr("value",0);
		    $(".bytes_send").html("0%");
		}
	    
	 }, function(error){
	 	 uploadLoader.hide();
	     toastMsg( getTrans("An error has occurred: Code","error_occured") + " "+ error.code);
	 }, options);
	 
	} catch(err) {
       alert(err.message);
    } 
}

function addPhotoSelection()
{
	var dialog = document.getElementById('addphotoSelection');
	if (dialog) {
	      dialog.show();	      	      
	} else {
	    ons.createDialog('addphotoSelection.html')
	      .then(function(dialog) {
	        dialog.show();	        	        
	        setTimeout('TransLatePage()', 300);	
	    });
	}	
}

function showCemara()
{
		
	try { 
		
		map_navigator = 1;		
		setStorage('camera_on', 1 );
		
		if (isDebug()){
			toastMsg("show camera");
			var dialog = document.getElementById('addphotoSelection');
		    dialog.hide();
			return;
		}
				
		var dialog = document.getElementById('addphotoSelection');
		dialog.hide();
				
		var cam_options = {
			destinationType: Camera.DestinationType.FILE_URI,
		    sourceType: Camera.PictureSourceType.CAMERA,
		    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)
		};
		
		var app_resize_picture = getStorage("enabled_resize_photo");
		
		if ( app_resize_picture==1){
			cam_options={
				destinationType: Camera.DestinationType.FILE_URI,
			    sourceType: Camera.PictureSourceType.CAMERA,
			    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY),
			    targetHeight: getStorage("photo_resize_width") ,
				targetWidth:  getStorage("photo_resize_height")
			};
		}
		
		navigator.camera.getPicture(uploadTaskPhoto, function(){
			toastMsg( getTrans("Get photo failed","get_photo_failed") );
			setStorage('camera_on', 2 );
			map_navigator = 0;
		}, cam_options );
	
	} catch(err) {
	   map_navigator = 0;
       alert(err.message);
    } 
}

function uploadTaskPhoto(imageURI)
{
	 try {
	 		 
	 map_navigator = 0;
	 setStorage('camera_on', 2 );
	 	
     uploadLoader.show();
	 
	 setTimeout(function(){
		$("#progress_bar").attr("value",0);
		$(".bytes_send").html("0%");
	 }, 1);	
	 	 
	 var options = new FileUploadOptions();
	 options.fileKey = "file";
	 options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
	 options.mimeType = "image/jpeg";
	 	 
	 var params = {};
	 params.token = getStorage("kr_token") ;	 
	 params.task_id = $(".task_id_details").val() ;	 
	 options.params = params;
 
	 options.chunkedMode = false;	
	 
	 var headers={'headerParam':'headerValue'};
	 options.headers = headers;
	
	 var ft = new FileTransfer();	 	 	 
	 
	 ft.onprogress = function(progressEvent) {
     if (progressEvent.lengthComputable) {
     	    
     	    var loaded_bytes= parseInt(progressEvent.loaded);
     	    var total_bytes= parseInt(progressEvent.total);
     	    
     	    var loaded_percent = (loaded_bytes/total_bytes)*100;	        
     	    loaded_percent=Math.ceil(loaded_percent);
     	    	        
	        $("#progress_bar").attr("value",loaded_percent);
		    $(".bytes_send").html(loaded_percent+"%");
	        
	        if(loaded_bytes>=total_bytes){	        	        
	        	uploadLoader.hide();
	        	$("#progress_bar").attr("value",0);
		        $(".bytes_send").html("0%");
	        }
     	    
	        loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);	        
	        
	    } else {	    		    	
	        loadingStatus.increment();	        
	    }
	 };
	 	 
	 ft.upload(imageURI, ajax_url+"/UploadTaskPhoto", function(result){
	    
	    if( $('#uploadLoader').is(':visible') ){
			uploadLoader.hide();
			$("#progress_bar").attr("value",0);
		    $(".bytes_send").html("0%");
		}    
	    
	    var response=explode("|",result.response);	    
	    toastMsg(response[1]);		   
	    if ( response[0]=="1" || response[0]==1){
	    	var dialog = document.getElementById('addphotoSelection');
	        dialog.hide();	    	                
	        callAjax("TaskDetails",'task_id=' + $(".task_id_details").val() );
	    }
	    
	 }, function(error){
	 	 uploadLoader.hide();
	     toastMsg( getTrans("An error has occurred: Code","error_occured") + " "+ error.code);
	 }, options);
	 
	 } catch(err) {
       alert(err.message);
     } 
}

function showPhotoPage()
{
   //photoPage	
   showPage("photoPage.html",'');
}

function deletePhoto(id)
{
	ons.notification.confirm({
	  title: dialog_title_default ,		  
      message: getTrans("Delete this photos?","delete_this_photo") ,
      callback: function(idx) {
        switch (idx) {
          case 0:            
            break;
          case 1:
            callAjax("deletePhoto",'id=' + id );
            break;
        }
      }
    });
}

/*Location tracking in background*/
function onBackgroundMode()
{
	app_running_status="background";	
	stopCron();	
}

function onForegroundMode()
{	

	try {
						
		map_navigator=0;
		app_running_status="active";	
		setStorage("bg_tracking",2);
		checkGPS();	
		
		/*RUN CRON INSTANT*/	
		runCron('foreGroundLocation');
		runCron('getNewTask');
		
		$handle_location[1] =  setInterval(function(){runCron('foreGroundLocation')}, $cron_interval );
		$handle_location[2] =  setInterval(function(){runCron('getNewTask')}, $cron_interval );
		
		watchPositionLT();
		
		if(cordova.platformId == "ios"){
			window.FirebasePlugin.getBadgeNumber(function(n) {		   	       
		       total_badge = parseInt(n);	       
		       if(total_badge>0){
		       	   window.FirebasePlugin.setBadgeNumber(0);
		       }
		    });
		}
		
	} catch(err) {
       //toastMsg(err.message);       
    }  
	
}


function iOSeleven()
{	
	if ( device.platform =="iOS"){	
		version = parseFloat(device.version);		
		if ( version>=11 ){
			return true;
		}
	}	
}


handleNotification = function(data){
	//alert(JSON.stringify(data)); 
	setBaloon();
	
	push_actions='';
	
	if ( device.platform =="iOS"){
		$.each( data.additionalData, function( key, data ) {	  	 	
	  	 	if (key=="gcm.notification.actions"){
	  	 		push_actions = data;
	  	 	}
	  	 });
	} else {		
		push_actions = data.additionalData.actions;	   
	}	
		
	
	switch ( push_actions ){
	    	
		case "ASSIGN_TASK":
  	 	case "CANCEL_TASK":
  	 	case "UPDATE_TASK":
	  	 	toastMsg( data.message );
	  	 	
	  	 	current_page = kNavigator.topPage.id;	  	 	 	 	
	  	 	if(current_page=="home"){
	  	 		 setTimeout(function(){ 
	  	 		 	getTodayTask('');
	  	 		 }, 1000);
	  	 	} else {
	  	 		reload_home = 1;
	  	 	} 	  	 	  
  	 	break;
  	 	  	 	
  	 	default:
  	 	  toastMsg( data.message ); 	  	 	
  	 	break;
    }
	
};

getParams = function(){
	
	params ='';
	lang = getStorage("kr_lang_id");
		
	if(!empty(lang)){
	   params+="&lang="+lang;
	}
	
	if(!empty(krms_driver_config.APIHasKey)){
		params+="&api_key="+krms_driver_config.APIHasKey;
	}		
	
	if ( !empty( getStorage("kr_token") )){		
		params+="&token="+  getStorage("kr_token");
	}
		
	params+="&device_platform=" + device_platform;
	
	device_id = getStorage("device_id");
	if(!empty(device_id)){
	   params+="&device_id="+ getStorage("device_id");
	}
	
	params+="&app_version=" + app_version;
		
	return params;
};

var send_post_ajax;

sendPost = function(action,params){
		
	try {
		
		if ( !hasConnection() ){
		   toastMsg( getTrans("Not connected to internet",'no_connection') );	
		   return;
	    }
	
		params+=getParams();
		
		send_post_ajax = $.ajax({
		  url: ajax_url+"/"+action, 
		  method: "GET",
		  data: params,
		  dataType: "json",
		  timeout: ajax_timeout ,
		  crossDomain: true,
		  beforeSend: function( xhr ) {      
		  	
		  	clearTimeout( timer[102] );
		  	
		  	if(send_post_ajax != null) {			 				   			   
	           send_post_ajax.abort();
			 } else {    								
				timer[102] = setTimeout(function() {		
	         		if( send_post_ajax != null) {		
					   send_post_ajax.abort();					   
	         		}         		         		
		        }, ajax_timeout ); 
						
			 }
		  	 
	      }
	    });
	    
	    send_post_ajax.done(function( data ) {	    	 
	    	 if(data.code==1){
	    	 	setStorage("device_id", data.details ); 
	    	 	removeStorage("push_unregister");
	    	 } else {    	 
	    	 	// do nothing	
	    	 }
	    });
	    
	    send_post_ajax.always(function() {        
	    	send_post_ajax=null;   
	    });
	          
	    /*FAIL*/
	    send_post_ajax.fail(function( jqXHR, textStatus ) {    	
	    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
			if(textStatus!="abort"){
			   showToast( textStatus + "\n" + $text );             
			}
	    });    
    

    } catch(err) {
       showToast(err.message);       
    } 
};

getIcons = function(){
	map_icons='';
	map_icon = getStorage("map_icons");
	if(!empty(map_icon)){
	   map_icons =  JSON.parse( map_icon );
	} else {
	   map_icons = {
	   	 driver : 'http://maps.gstatic.com/mapfiles/markers2/marker.png',
	   	 customer: 'http://maps.gstatic.com/mapfiles/markers2/icon_green.png',
	   	 merchant : 'http://maps.gstatic.com/mapfiles/markers2/boost-marker-mapview.png'
	   };	
	}
	return map_icons;
};

initMap = function(lat, lng, address){
	try {
		
		if(empty(lat) && empty(lng)){
		   toastMsg( getTrans("Missing Coordinates","missing_coordinates") );	
		   return;
		}
		
		$("#task_lat").val(lat);
		$("#task_lng").val(lng);
		
		map_icons = getIcons();		
		dump(map_icons);
		
		map_bounds = [];
		
		options = {
		  div: "#map_canvas",
		  lat: lat,
		  lng: lng,
		  disableDefaultUI: true,
		  styles: map_style ,
	   };
	   
	   map = new GMaps(options);	   
	   info_html = '<p><b>'+address+"<br/></b>";	   
	   var infoWindow = new google.maps.InfoWindow({
		    content: info_html
	   });	
	   
	   map_marker =  map.addMarker({
		  lat: lat,
		  lng: lng,
		  infoWindow: infoWindow,
		  icon: map_icons.customer
	   });	   
	   infoWindow.open(map, map_marker);
	   
	   var latlng = new google.maps.LatLng( lat , lng );
	   map_bounds.push(latlng);
	   setMapCenter();
	   
	   /*PLOT DRIVER CURRENT LOCATION*/
	    navigator.geolocation.getCurrentPosition( function(position){		
	    	       
       	  var your_lat = position.coords.latitude;
          var your_lng = position.coords.longitude;
          
          $("#your_lat").val(your_lat);
          $("#your_lng").val(your_lng);
                                      
          dump("your location=>"+your_lat + " => "+  your_lng);
           info_html = "<p>"+ getTrans('You are here','you_are_here') +"</b>";	   
		   var infoWindow = new google.maps.InfoWindow({
			    content: info_html
		   });	
          
          marker_driver =  map.addMarker({
			  lat: your_lat,
			  lng: your_lng	,			
			  icon: map_icons.driver,
			  infoWindow: infoWindow,		  
		  });
		  infoWindow.open(map, marker_driver);
		  
		  var latlng = new google.maps.LatLng( your_lat , your_lng );
		  map_bounds.push(latlng);		  
		  
		  map.drawRoute({
		    origin: [your_lat , your_lng ],
			destination: [ lat , lng ],
		    travelMode: 'driving',
		    strokeColor: '#131540',
		    strokeOpacity: 0.6,
		    strokeWeight: 6
		  });		
		  
		  setMapCenter();
          
       }, function(error){
       	  // GET LOCATION HAS FAILED     
       	  toastMsg( error.message );  	  
       }, 
       { timeout: 60000 , enableHighAccuracy: getLocationAccuracy(), maximumAge:Infinity } );	
	   	   	   
	   
	} catch(err) {		
	    toastMsg(err.message);
	}  
	
};

setMapCenter = function(){			
	map_provider = getMapProvider();
	dump("map_provider=>"+map_provider);
	switch (map_provider) {
		case "mapbox":
		  centerMapbox();
		break;
		
		default:
		   map.fitLatLngBounds(map_bounds);
		break;
	}	
};

getDirections = function(){
	
	try {
		
		your_lat = $("#your_lat").val();
		your_lng = $("#your_lng").val();
		
		task_lat = $("#task_lat").val();
		task_lng = $("#task_lng").val();
		
		
		if (!empty(task_lat) && !empty(task_lng) ) {
			
		  launchnavigator.navigate( [task_lat, task_lng] );
		
		} else {
			toastMsg( getTrans("Missing Coordinates","missing_coordinates") );
		}
		
	} catch(err) {		
	    dump(err.message);
	} 
};


viewDropOffMap = function(){			
	kNavigator.pushPage("map_dropoff.html", {
		animation: 'none',
	});	
};

createInfoWindow = function(html){	
    infoWindow = new google.maps.InfoWindow({
		content: html
	});
	return infoWindow;
};

initMapDropOff = function(){
	dump('initMapDropOff');
	var data = JSON.parse(getStorage("task_full_data"));
	dump(data);
	
	map_icons = getIcons();		
	dump(map_icons);
	
	var lat = data.task_lat;
	var lng = data.task_lng;
	
	$(".direction_task_lat").val( lat );
	$(".direction_task_lng").val( lng );
	
	if(empty(lat) && empty(lng)){
	   toastMsg( getTrans("Missing Coordinates","missing_coordinates") );	
	   return;
	}
	
	var your_lat;
	var your_lng;
	
	var dropoff_lat;
	var dropoff_lng;
	
	
	map_bounds = [];
	
	options = {
	  div: "#map_canvas",
	  lat: lat,
	  lng: lng,
	  disableDefaultUI: true,
	  styles: map_style ,
   };
   
   map = new GMaps(options);	   
   info_html = '<p><b>'+ t("Customer information") +"<br/></b>";
   info_html+= '<b>'+data.customer_name+"<br/></b></p>";	  
    info_html+='<p>'+ data.delivery_address +'</p>';
   info_window = createInfoWindow(info_html);
   
   map_marker =  map.addMarker({
	  lat: lat,
	  lng: lng,
	  infoWindow: info_window,
	  icon: map_icons.customer
   });	   
   infoWindow.open(map, map_marker);
   
   var latlng = new google.maps.LatLng( lat , lng );
   map_bounds.push(latlng);
   
   
   /*MARKER FOR DROP FF*/
   if(!empty(data.dropoff_lat) && !empty(data.dropoff_lng)){
   	
   	   dropoff_lat = data.dropoff_lat;
   	   dropoff_lng = data.dropoff_lng;
   	   
   	   $(".direction_dropoff_lat").val( dropoff_lat );
	   $(".direction_dropoff_lng").val( dropoff_lng );
   	
   	   info_html = '<p><b>'+ t("Merchant information") +"<br/></b>";
   	   info_html+= '<b>'+data.merchant_name+"<br/></b></p>";
   	   info_html+= '<p>'+ data.drop_address +'</p>';   	
   	   info_window = createInfoWindow(info_html);
   	   	   
   	   marker_merchant =  map.addMarker({
		  lat: dropoff_lat,
		  lng: dropoff_lng,
		  infoWindow: info_window,
		  icon: map_icons.merchant
	   });	   
	   infoWindow.open(map, marker_merchant);
	   
	   var latlng = new google.maps.LatLng( dropoff_lat , dropoff_lng );
       map_bounds.push(latlng);
   }
   
   /*ADD DRIVER MARKER*/   
   navigator.geolocation.getCurrentPosition( function(position){
   	   
   	   your_lat = position.coords.latitude;
       your_lng = position.coords.longitude;
       
       $(".driver_location_lat").val(your_lat);
       $(".driver_location_lng").val(your_lng);
       
       info_html = "<p>"+ getTrans('You are here','you_are_here') +"</b>";	   
	   info_window = createInfoWindow(info_html);
          
       marker_driver =  map.addMarker({
		  lat: your_lat,
		  lng: your_lng	,			
		  icon: map_icons.driver,
		  infoWindow: info_html,		  
	   });
	   infoWindow.open(map, marker_driver);
	  
	  var latlng = new google.maps.LatLng( your_lat , your_lng );
	  map_bounds.push(latlng);		  	

	  /*ADD ROUTE*/   
	  if(!empty(dropoff_lat) && !empty(dropoff_lng)){   	  
	   	  map.drawRoute({
		    origin: [your_lat , your_lng ],
			destination: [ dropoff_lat , dropoff_lng ],
		    travelMode: 'driving',
		    strokeColor: '#131540',
		    strokeOpacity: 0.6,
		    strokeWeight: 6
	      });
	   }     
	   
	   map.drawRoute({
	    origin: [dropoff_lat , dropoff_lng ],
		destination: [ lat , lng ],
	    travelMode: 'driving',
	    strokeColor: '#FFFF00',
	    strokeOpacity: 0.6,
	    strokeWeight: 6
      });
	   	
   }, function(error){
       toastMsg( "d2"+error.message ); 	  
   }, 
   { timeout: 60000 , enableHighAccuracy: getLocationAccuracy(), maximumAge:0 } );
   
      
   setMapCenter();
	
};

getDirectionsDropoff = function(){
	
	dump('getDirectionsDropoff');
	ons.openActionSheet({
    title: t("Choose your directions"),
    cancelable: true,
    buttons: [      
      {
        label: t('Direction to restaurant'),  
        icon: 'ion-android-restaurant'      
      },
      {
        label: t('Direction to customer'),        
        icon: 'ion-android-person'
      },
      {
        label: 'Cancel',
        icon: 'md-close'
      }
    ]
  }).then(function (index) { 
  	 dump("selected=>"+ index);
  	 try {
	  	 switch(index){
	  	 	case 0: 
	  	 	  lat = $(".direction_dropoff_lat").val();
	  	 	  lng = $(".direction_dropoff_lng").val();
	  	 	  launchnavigator.navigate([lat, lng]);
	  	 	break;
	  	 	
	  	 	case 1:
	  	 	  lat = $(".direction_task_lat").val();
	  	 	  lng = $(".direction_task_lng").val();
	  	 	  launchnavigator.navigate([lat, lng]);
	  	 	break;
	  	 }
  	 } catch(err) {		
	    dump(err.message);
	 } 	
  });
  	
};

getMapProvider = function(){
	map_provider = getStorage("map_provider");
	if(empty(map_provider)){
		map_provider = 'google.maps';
	}
	return map_provider;
}; 

document.addEventListener('prechange', function(event) {
	dump('prechange');
	dump("tab index ->" + event.index);	
	
	current_page = kNavigator.topPage.id;
	dump("current_page=>"+ current_page);
	
	switch (event.index){
		case 0:
		
		break;
		
		case 1:
		 if(current_page=="home"){
		 	//		 	 
		 } else if (current_page=="profilePage") {		 	 
		 	TransLatePage();
		 }
		break;
	}
});
/*end class*/

initBackgroundTracking = function(){
	
	try {
			
		var app_disabled_bg_tracking=getStorage("disabled_tracking_bg");
		if (app_disabled_bg_tracking==1 || app_disabled_bg_tracking=="1"){		
			return;
		}		
		
		var min_frequency = getStorage("track_interval");		
		if (min_frequency<=0){
			min_frequency=8000;
		}
		if (empty(min_frequency)){
			min_frequency=8000;
		}

				
		if(cordova.platformId === "android"){			
			$bg_provider =  BackgroundGeolocation.DISTANCE_FILTER_PROVIDER;
			$desired_accuracy =  BackgroundGeolocation.MEDIUM_ACCURACY;
			$start_foreground = true;
		} else {			
			$bg_provider =  BackgroundGeolocation.RAW_PROVIDER;
			$desired_accuracy =  BackgroundGeolocation.HIGH_ACCURACY;
			$start_foreground = false;
		}
			
		BackgroundGeolocation.configure({		    
		    locationProvider: $bg_provider,
		    desiredAccuracy: $desired_accuracy,
		    startForeground: $start_foreground ,
		    stationaryRadius: 0,
		    distanceFilter: 0,
		    notificationTitle: getTrans("Tracking","tracking") +  "..." ,
		    notificationText: '',
		    debug: false,
		    interval: min_frequency,
		    fastestInterval: min_frequency,
		    activitiesInterval: min_frequency,
		    stopOnTerminate: true,
		    saveBatteryOnBackground : false, 
		    notificationsEnabled : false,
		    activityType : 'OtherNavigation',
		    pauseLocationUpdates : false,
		    url: ajax_url+"/updateDriverLocation" ,		
		    syncUrl : ajax_url+"/updateDriverLocationFailed" ,		     
		    postTemplate: {
		       lat: '@latitude',
		       lng: '@longitude',                
		       altitude : '@altitude',
		       accuracy : '@accuracy',
		       speed : '@speed',
		       track_type : "background",
		       token : getStorage("kr_token"),
		       app_version : app_version,
		       api_key : krms_driver_config.APIHasKey, 
		       device_platform : cordova.platformId      
		    }
		 });
		 
		 BackgroundGeolocation.on('location', function(location) {
		 	 
		 	 BackgroundGeolocation.startTask(function(taskKey) {
		 	 			 	 	 
		 	 	 $latitude = !empty(location.latitude)?location.latitude:'';
		 	 	 $longitude = !empty(location.longitude)?location.longitude:'';
		 	 	 $accuracy = !empty(location.accuracy)?location.accuracy:'';
		 	 	 $altitude = !empty(location.altitude)?location.altitude:'';
		 	 	 
		 	 	 params = 'lat='+ $latitude + "&lng=" + $longitude;
			     params+="&app_version=" + app_version;	     			     
			     params+="&accuracy="+ $accuracy;
			     params+="&altitudeAccuracy="+ $altitude;
			     params+="&heading="+ '';
			     params+="&speed="+ '';
			     params+="&track_type=location";
			     				     
			     //callAjax2('updateDriverLocation', params);
		 	 	
		 	 	 BackgroundGeolocation.endTask(taskKey);
		 	 });
		 });
		 
		 BackgroundGeolocation.on('stationary', function(location) {		  		     
		    
		     $latitude = !empty(location.latitude)?location.latitude:'';
	 	 	 $longitude = !empty(location.longitude)?location.longitude:'';
	 	 	 $accuracy = !empty(location.accuracy)?location.accuracy:'';
	 	 	 $altitude = !empty(location.altitude)?location.altitude:'';
	 	 	 
	 	 	 params = 'lat='+ $latitude + "&lng=" + $longitude;
		     params+="&app_version=" + app_version;	     			     
		     params+="&accuracy="+ $accuracy;
		     params+="&altitudeAccuracy="+ $altitude;
		     params+="&heading="+ '';
		     params+="&speed="+ '';
		     params+="&track_type=stationary";
		     				     
		     callAjax2('updateDriverLocation', params);
		    
		 });
		 
		 BackgroundGeolocation.on('error', function(error) {
		    showToast('[ERROR] BackgroundGeolocation error:', error.code, error.message);
		 });
		 
		 BackgroundGeolocation.on('start', function() {
		    //showToast('[INFO] BackgroundGeolocation service has been started');
		 });
		
		 BackgroundGeolocation.on('stop', function() {
		    //showToast('[INFO] BackgroundGeolocation service has been stopped');
		 });			 

		 BackgroundGeolocation.on('authorization', function(status) {
		    console.log('[INFO] BackgroundGeolocation authorization status: ' + status);
		    if (status !== BackgroundGeolocation.AUTHORIZED) {
		      // we need to set delay or otherwise alert may not be shown
		      setTimeout(function() {
		        var showSettings = confirm('App requires location tracking permission. Would you like to open app settings?');
		        if (showSettings) {
		          return BackgroundGeolocation.showAppSettings();
		        }
		      }, 1000);
		    }
		 });
		 
		BackgroundGeolocation.on('abort_requested', function() {
			 showToast('[INFO] Server responded with 285 Updates Not Required');
		});
		
		BackgroundGeolocation.on('background', function() {
			
			if(map_navigator==1){
				return;
			}
			
			/*BackgroundGeolocation.checkStatus(function(status) {
				if (!status.isRunning) {
					setTimeout(function() {	    	   
				       BackgroundGeolocation.start();  
				    }, 300);
				}
			});*/
			
			
		});
		
		BackgroundGeolocation.on('foreground', function() {
									
			/*BackgroundGeolocation.checkStatus(function(status) {
				if (status.isRunning) {
					setTimeout(function() {	    	   
				       BackgroundGeolocation.stop();				       
				    }, 300);
				}
			});*/
		});
		
		BackgroundGeolocation.checkStatus(function(status) {
			if (!status.isRunning) {
				setTimeout(function() {	    	   
			       BackgroundGeolocation.start();  
			    }, 300);
			}
		});
		
    } catch(err) {
       //alert(err.message);  
    }  
};

runCron = function($cron_type){
	dump("runCron=>"+ $cron_type);
	switch ($cron_type){
		case "foreGroundLocation":
		  /* navigator.geolocation.getCurrentPosition( function(position) {	    
		   	     
			   	 $latitude = position.coords.latitude;
		 	 	 $longitude = position.coords.longitude;
		 	 	 $accuracy = position.coords.accuracy;
		 	 	 $altitude = !empty(position.coords.altitudeAccuracy)?position.coords.altitudeAccuracy:'';
		 	 	 $heading = !empty(position.coords.heading)?position.coords.heading:'';
		 	 	 $speed = !empty(position.coords.speed)?position.coords.speed:'';
		 	 	 
		 	 	 params = 'lat='+ $latitude + "&lng=" + $longitude;
			     params+="&app_version=" + app_version;	     			     
			     params+="&accuracy="+ $accuracy;
			     params+="&altitudeAccuracy="+ $altitude;
			     params+="&heading="+ $heading;
			     params+="&speed="+ $speed;
			     params+="&track_type=foreground";
			     			     				    
			     callAjax2('updateDriverLocation', params);     
		   	
		      }, function(error){
		    	     	 
		      }, 
		      { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
		    );	*/    	  	
		break;
		
		case "getNewTask":
		   getNewTask();
		break;
	}
};

pullHookCompleted = function(){
	
	  var pullHook = document.getElementById('pull-hook-completed');
	  pullHook.onAction = function(done) {		
	 	  params="date="+ getStorage("kr_todays_date_raw");
	 	  var onduty = document.getElementById('onduty').checked==true?1:2 ;	
	 	  params+="&onduty="+onduty+"&task_type=completed";
	 	  	 	  
          AjaxTask("getTaskCompleted",params,done);
      }; 
	  pullHook.addEventListener('changestate', function(event) {
	 	  var message = '';
	 	   dump(event.state);
	 	   switch (event.state) {
		      case 'initial':
		        message = '<ons-icon size="35px" icon="ion-arrow-down-a"></ons-icon> Pull down to refresh';
		        break;
		      case 'preaction':
		        message = '<ons-icon size="35px" icon="ion-arrow-up-a"></ons-icon> Release';
		        break;
		      case 'action':
		        message = '<ons-icon size="35px" spin="true" icon="ion-load-d"></ons-icon> Loading...';
		        break;
	      }
	      pullHook.innerHTML = message;
	  });
};

t = function(data){	
	if(!empty(translator)){
	    return translator.get(data);		
	}
};


placeholder = function(field, value){
	$(field).attr("placeholder", t(value) );
};

document.addEventListener('preshow', function(event) {
	dump("preshow");	
	var page = event.target;
	var page_id = event.target.id;   
	dump("pre show : "+ page_id)
	
	switch (page_id){
		case "dialogChangePass":
		   placeholder(".email_field",'email');
		   placeholder(".code_field",'code');
		   placeholder(".new_password_field",'new_password');
		break;
	}
	
});


function t(key, value){
	getTrans(value,key);
}

showLoader = function(show, loader_id) {			
	dump("loader_id=>"+ loader_id);
	if(!empty(loader_id)){
		var modal = document.querySelector('#'+ loader_id);
	} else {
		var modal = document.querySelector('#loader');	
	}
	
	if(empty(modal)){
		return ;
	}
		
	if(show){
	  modal.show();
	} else {	  
	  modal.hide();
	}		  
};


getParamsArray = function(){
		
	$params = {
		"lang": !empty(getStorage("kr_lang_id"))?getStorage("kr_lang_id"):'' ,
		"api_key" : krms_driver_config.APIHasKey,
		"token" : getStorage("kr_token"),
		"device_platform" : device_platform,
		"device_id" : getStorage("device_id"),
		"app_version": app_version
	};
	return $params;
};

externalPhoneCall = function(phone){
	if(!empty(phone)){
		window.open( "tel:" + phone  );
	} else {
		showToast( t("empty_phone","Empty phone number") ,'danger');
	}
};


q = function(data){
	return "'" + addslashes(data) + "'";
};

var addslashes = function(str)
{
	return (str + '')
    .replace(/[\\"']/g, '\\$&')
    .replace(/\u0000/g, '\\0')
};

mapExternalDirection = function(lat,lng){
	if(!empty(lat)){
	   if( isDebug() ){
	   	   toastMsg("App is in debug mode "+lat+"="+lng);
	   } else {
	   	
	   	 try {
		    	   	 	
	        launchnavigator.isAppAvailable(launchnavigator.APP.GOOGLE_MAPS, function(isAvailable){
				    var app;
				    if(isAvailable){				        
				        app = launchnavigator.APP.USER_SELECT;
				    }else{		        
				        app = launchnavigator.APP.USER_SELECT;
				    }
				    
				    map_navigator = 1;
				    
				    launchnavigator.navigate( [lat, lng] , {
				        app: app
				    });
				});
			
			} catch(err) {		
				map_navigator = 0;
				showToast(err.message);	    				
			}    
		   	
	   }
	} else {
		showToast( t("Empty latitude and longititude") ,'danger');
	}
}

getCurrentPage = function(){
	return document.querySelector('ons-navigator').topPage.id;
};

initSubscribe = function($value){
	$topic_new_task = getStorage("topic_new_task");
	$topic_alert = getStorage("topic_alert");	
	if($value==1 && !empty($topic_new_task) && !empty($topic_alert) ){		
		subscribe($topic_new_task);
		setTimeout(function(){ 			 	 
			subscribe($topic_alert); 
        }, 200);
	} 
	
	if($value!=1 && !empty($topic_new_task) && !empty($topic_alert) ){		
		unsubscribe($topic_new_task);
		setTimeout(function(){ 			 	 
			unsubscribe($topic_alert); 
        }, 200);
	} 
};

handlePushReceive = function(data){	
	 if(cordova.platformId === "android"){
	 	showToast( data.title+"\n"+data.body, 'success');
     } else if(cordova.platformId === "ios"){         	
     	showToast( data.aps.alert.title +"\n"+ data.aps.alert.body , 'success');     	
     }
     
     refreshOrderTab(  'push'  );
     
};

/*START FIREBASEX  */
initFirebasex = function(){
	try {	
			   
	    window.FirebasePlugin.onMessageReceived(function(data) {
	        try{	        	
	        	handlePushReceive(data);
	        }catch(e){
	            //alert("Exception in onMessageReceived callback: "+e.data);
	        }
	
	    }, function(error) {
	        alert("Failed receiving FirebasePlugin message", error);
	    });
	    
	    window.FirebasePlugin.onTokenRefresh(function(token){	        
	        device_id = token;
	        setStorage("device_id", token );	        
	    }, function(error) {
	        dump("Failed to refresh token");
	    });
	    	     	    
	     checkNotificationPermission(false);	
	     	     	     
	     if(cordova.platformId === "android"){
	     	initAndroid();
	     }else if(cordova.platformId === "ios"){
	     	initIos();
	     }
	    
	} catch(err) {
       alert(err.message);       
    } 
};

var initIos = function(){
    window.FirebasePlugin.onApnsTokenReceived(function(token){        
        //
    }, function(error) {
        dump("Failed to receive APNS token");
    });
};

var checkNotificationPermission = function(requested){
    window.FirebasePlugin.hasPermission(function(hasPermission){
        if(hasPermission){            
            getToken();
        }else if(!requested){            
            window.FirebasePlugin.grantPermission(checkNotificationPermission.bind(this, true));
        }else{            
            alert("Notifications won't be shown as permission is denied");
        }
    });
};

var getToken = function(){
    window.FirebasePlugin.getToken(function(token){        
        device_id = token;
        setStorage("device_id", token );        
    }, function(error) {
        dump("Failed to get FCM token");
    });
};

initAndroid = function(){
	var customChannel  = {
		id: "kmrs_driver",
		name: "driver app channel",
		sound: "neworder",
		vibration: [300, 200, 300],
		light: true,
	    lightColor: "0xFF0000FF",
	    importance: 4,
	    badge: true, 
	    visibility: 1
	};
	
	 window.FirebasePlugin.createChannel(customChannel,
        function() {            
            window.FirebasePlugin.listChannels(
                function(channels) {
                    if(typeof channels == "undefined") return;
                    for(var i=0;i<channels.length;i++) {                        
                    }
                },
                function(error) {
                    dump('List channels error: ' + error);
                }
            );
        },
        function(error) {
            showToast("Create channel error", error);
        }
    );    
        
};

function subscribe($topic){
	try {
		
	    window.FirebasePlugin.subscribe($topic, function(){
	        //showToast("Subscribed to topic");
	    },function(error){
	        //showToast("Failed to subscribe to alert", error);
	    });
	    
    } catch(err) {
       dump(err.message);       
    } 
}

function unsubscribe($topic){
	try {
	    window.FirebasePlugin.unsubscribe($topic, function(){
	        //showToast("Unsubscribed from topic");
	    },function(error){
	        //showToast("Failed to unsubscribe from alert", error);
	    });
    } catch(err) {
       dump(err.message);       
    } 
}

/*END FIREBASEX  */


getNewTask = function(){
	try {
		
	     params='';
	     params+=getParams();	
	   
	     ajax_new_task = $.ajax({
		  url: ajax_url+"/getNewTask",
		  method: "post" ,
		  data: params ,
		  dataType: "json",
		  timeout: ajax_timeout,
		  crossDomain: true,
		  beforeSend: function( xhr ) {
		  	
		  	 clearTimeout( timer[103] );
		  	
	         if(ajax_new_task != null) {		   
	           ajax_new_task.abort();
			 } else {    				
				timer[103] = setTimeout(function() {		
	         		if( ajax_new_task != null) {		
					   ajax_new_task.abort();				   
	         		}         		         		
		        }, ajax_timeout ); 	
			 }
	      }
	    });
	
	    ajax_new_task.done(function( data ) {
	    	dump(data);
	    	if(data.code==1){
	    		refreshOrderTab( data.msg );
	    	}
	    });
		
		ajax_new_task.always(function() {        
	        ajax_new_task = null;  
	    });	
	    
	    ajax_new_task.fail(function( jqXHR, textStatus ) {    		    	
	    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
			if(textStatus!="abort"){
			   //showToast( textStatus + "\n" + $text );             
			}
	    });     
	   
	 } catch(err) {
       dump(err.message);       
    } 
};

playMedia = function($sounds_type){
	try {	
		
		 $sound_path = "";					
		 if(cordova.platformId === "android"){
	     	$sound_path = cordova.file.applicationDirectory + "www/sounds/"+$sounds_type+".mp3";
	     } else if(cordova.platformId === "ios"){
	     	$sound_path = "sounds/"+$sounds_type+".mp3";
	     }		 			   
		 var my_media = new Media( $sound_path ,	        
	        function () { 
	        	//ok
	        },	        
	        function (err) { 
	        	// failed
	        }
	    );
	    
	    my_media.play({ playAudioWhenScreenIsLocked : true });
	    my_media.setVolume(1.0);		    
	    my_media.play();
	    setTimeout(function(){		
	    	my_media.stop();
	        my_media.release();	             	    	
	    }, 4000);
		    
    } catch(err) {        
        dump(err.message);        
    }    		
};

showDialog = function(show, dialog_name){
		
	d = document.getElementById(dialog_name);   
	if(d){
	   if(show){
	     d.show();
	   } else {
	   	 d.hide();
	   }
	} else {
	   if(show){
		   ons.createElement( dialog_name + '.html', { append: true }).then(function(dialog) {       	
	        dialog.show();
	       });
	   } 
	}
};

refreshOrderTab = function(message){
		
    $current_page_id = getCurrentPage();
	$active_tabbar = document.querySelector('ons-tabbar').getActiveTabIndex();
		    		
	if(!empty(message)){
	   if(message!="push"){
	      showToast( message ,'success');
	   }
	}
	
	setTimeout(function(){	
	   playMedia("neworder");	    		   
	}, 100);
	
	if($current_page_id=="home"){
		setTimeout(function(){	
			params="date="+ getStorage("kr_todays_date_raw");
	 	    var onduty = document.getElementById('onduty').checked==true?1:2 ;	
	 	    params+="&onduty="+onduty;
	        AjaxTask("GetTaskByDate",params,'');
        }, 100);
	}  
	
};

stopCron = function(){
   if ((typeof  $handle_location[1] !== "undefined") && ( $handle_location[1] !== null)) {
   	   dump("stopCron");
	   clearInterval($handle_location[1]);
	   clearInterval($handle_location[2]);
   }
   
   if ((typeof  window.BackgroundGeolocation !== "undefined") && ( window.BackgroundGeolocation !== null)) {
   	   if(cordova.platformId === "ios"){
   	      bgGeo.stopWatchPosition();
   	   }
   }
};

/*flow 
onProviderChange
onLocation
bgGeo.ready({
onMotionChange
onActivityChange
*/

initBackgroundLT = function(){
	try {
		
		 bgGeo = window.BackgroundGeolocation;
		
		 bgGeo.onLocation(function(location) {		    		 	 
		 	 $params = {
		 	 	"latitude" : location.coords.latitude,
		 	 	"longitude" : location.coords.longitude,
		 	 	"accuracy" : location.coords.accuracy,
		 	 	"altitude" : location.coords.altitude,
		 	 	"heading" : location.coords.heading,
		 	 	"speed" : location.coords.speed,
		 	 	"track_type" : "background-lt-onLocation"
		 	 };		 	 
		 	 sendDriverUpdates($params);		 	 		 	 
		  });
		
		 bgGeo.onMotionChange(function(event) {				 	 
		 	 $params = {
		 	 	"latitude" : event.location.coords.latitude,
		 	 	"longitude" : event.location.coords.longitude,
		 	 	"accuracy" : event.location.coords.accuracy,
		 	 	"altitude" : event.location.coords.altitude,
		 	 	"heading" : event.location.coords.heading,
		 	 	"speed" : event.location.coords.speed,
		 	 	"track_type" : "background-lt-onMotionChange"
		 	 };		 	 
		 	 sendDriverUpdates($params);
		 });
		
		 bgGeo.onHttp(function(response) {		    
		    //dump2(response);
		 });
		
		 bgGeo.onProviderChange(function(event) {		    		 	
		    //dump2(event);
		 });
		 
		 bgGeo.onHeartbeat(function(event) {     
		 	       
		    $params = {
		 	 	"latitude" : event.location.coords.latitude,
		 	 	"longitude" : event.location.coords.longitude,
		 	 	"accuracy" : event.location.coords.accuracy,
		 	 	"altitude" : event.location.coords.altitude,
		 	 	"heading" : event.location.coords.heading,
		 	 	"speed" : event.location.coords.speed,
		 	 	"track_type" : "background-lt-onHeartbeat"
		 	 };		 
		 	 sendDriverUpdates($params);
		 	 		 	 
		    /* bgGeo.getCurrentPosition({
			    samples: 1,
			    persist: true
			 }, function(location){
			 	
			 	 $params = {
			 	 	"latitude" : location.coords.latitude,
			 	 	"longitude" : location.coords.longitude,
			 	 	"accuracy" : location.coords.accuracy,
			 	 	"altitude" : location.coords.altitude,
			 	 	"heading" : location.coords.heading,
			 	 	"speed" : location.coords.speed,
			 	 	"track_type" : "background-lt-onHeartbeat2"
			 	 };		 	 
			 	 sendDriverUpdates($params); 			 	
			 });*/
		    
        });
                		
		bgGeo.onActivityChange(function(event) {			
			//showToast(JSON.stringify(event));	
        });             

        watchPositionLT();  
              
		bgGeo.ready({		    
		    debug: false,
		    logLevel: bgGeo.LOG_LEVEL_VERBOSE,
		    desiredAccuracy: bgGeo.DESIRED_ACCURACY_HIGH,
		    distanceFilter: cordova.platformId == "android" ? 0 : 1,
		    locationUpdateInterval : cordova.platformId == "android" ? 0 : 1000,
		    stationaryRadius: 1,
		    stopTimeout: 1,  
		    foregroundService: true,		    
		    heartbeatInterval: cordova.platformId == "android" ? 60 : 15,
		     notification: {
		        title: 'Karenderia',
		        text: 'Tracking...',
		        channelName: 'karenderia'
		     },			
		    locationAuthorizationAlert: {
		        titleWhenNotEnabled: 'Location services are disabled',
		        titleWhenOff: 'Location services are disabled',
		        instructions: 'You should enable "Always" in Location Services, to allow App work properly in the background',
		        cancelButton: 'Cancel',
		        settingsButton: 'Settings'
		    },
		    url: ajax_url+"/updateDriverLocation?provider=geolocation-lt" ,
		    params: {         
		      "api_key": krms_driver_config.APIHasKey,
		      "token": getStorage("kr_token"),
		      "track_type": "background-lt",
		      "device_platform" : cordova.platformId
		    },
		    autoSync: true,
		    stopOnTerminate: true,
		    startOnBoot: true,
		    preventSuspend : true,
		    locationAuthorizationRequest : "Always"		    
		  }, function(state) {  		    		    
		     if (!state.enabled) {
		        bgGeo.start().then(function() {
		          //dump2('- BackgroundGeolocation tracking started');		                 
		        });
		     }
		  });
		
	 } catch(err) {        
        dump2(err.message);        
    }    
};

watchPositionLT = function(){
	
	if ((typeof  window.BackgroundGeolocation !== "undefined") && ( window.BackgroundGeolocation !== null)) {
		bgGeo.watchPosition(function(location) {			
			//showToast("watchPosition");			
	    }, function(errorCode){
	    	//showToast("[watchPosition] ERROR -"  +  errorCode);
	    }, {
	        interval: 4000
	    });        
	}
};

runLTBackground = function(){
	bgGeo.startBackgroundTask(function(taskId) {
 	 	  $.get( ajax_url+"/updateDriverLocation?provider=geolocation-lt-task&app_version="+app_version ).then(
			  function() {
			    bgGeo.stopBackgroundTask(taskId);
			  }, function() {
			    bgGeo.stopBackgroundTask(taskId);
			  }
		  );	
 	 });
};

sendDriverUpdates = function($data){
	$latitude = !empty($data.latitude)?$data.latitude:'';
	$longitude = !empty($data.longitude)?$data.longitude:'';
	$accuracy = !empty($data.accuracy)?$data.accuracy:'';
	$altitude = !empty($data.altitude)?$data.altitude:'';
	$heading = !empty($data.heading)?$data.heading:'';
	$speed = !empty($data.speed)?$data.speed:'';
	$track_type = !empty($data.track_type)?$data.track_type:'';
	
	params = 'lat='+ $latitude + "&lng=" + $longitude;
	params+="&app_version=" + app_version;	     			     
	params+="&accuracy="+ $accuracy;
	params+="&altitudeAccuracy="+ $altitude;
	params+="&heading="+ $heading;
	params+="&speed="+ $speed;
	params+="&track_type=" + $track_type;
	
	callAjax2('updateDriverLocation', params);
};

testThen = function(){
	$.get( ajax_url+"/updateDriverLocation?provider=geolocation-lt&app_version="+app_version ).then(
	  function() {
	    alert( "$.get succeeded" );
	  }, function() {
	    alert( "$.get failed!" );
	  }
	);	
};

showPage2 = function(page_id, animation, data){
	
   if(empty(page_id)){
   	  return;
   }
   	
   if(empty(animation)){
   	  animation='lift';
   }
   if(empty(data)){
   	  data={};
   }
   kNavigator.pushPage(page_id,{
  	   animation : animation , 
  	   data : data 	
   });  
};

replacePage = function(page_id, animation, data){
   if(empty(animation)){
   	  animation='lift';
   }
   if(empty(data)){
   	  data={};
   }
   kNavigator.replacePage(page_id,{
  	   animation : animation ,  
  	   data : data	
   });  
};

var popPage = function(){
	try {
		kNavigator.popPage({
		 animation :"none"	
		});		
	} catch(err) {
      dump(err.message);
   } 
};

resetToPage = function(page_id, animation , data ){
   if(empty(animation)){
   	  animation='lift';
   }
   if(empty(data)){
   	  data={};
   }
   kNavigator.resetToPage(page_id,{
  	   animation : animation ,  	
  	   data : data
   });  
};




checkAccessBgLocation = function($page_permission, $page_next , $page_replace ){
	
	 if (isDebug()){
	 	$access_fine_location = parseInt(getStorage("access_driver_bg_location"));	 	
	 	
	 	if($access_fine_location==1){	 		
	 		replacePage($page_next);
	 	} else {	 		
	 		if($page_replace){
	 			resetToPage($page_permission,'lift',{
			 		'page_next': $page_next
			 	});
	 		} else {
			 	showPage2($page_permission,'lift',{
			 		'page_next': $page_next
			 	});
	 		}
	 	}
		return ;
	 }	 
	 
	 cordova.plugins.diagnostic.isLocationAuthorized(function(authorized){
	 	if(authorized){
	 		replacePage($page_next);
	 	} else {	 			 		
	 		showPage2($page_permission,'lift',{
	 			'page_next':$page_next
	 		});
	 	}
	 }, function(error){
	   showToast( t("The following error occurred:")  + " " + error ,'danger');
	});
};


requestBackgroundLocation = function(){
	
	current_page_id = getCurrentPage();
	$page_next = $("#"+ current_page_id + " .page_next" ).val();
	
	if (isDebug()){
		ons.notification.confirm( "Allow location to access device location" ,{
			title: "Location permission" ,		
			id : "dialog_order_options",
			modifier: " ",			
			buttonLabels : [  "Cancel", "Yes"  ]
		}).then(function(input) {				
			if (input==1){
				setStorage("access_driver_bg_location",1);
				resetToPage($page_next);
			}
	   }); 		
	   return ;
	 }	 
	 
	 cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
	    switch(status){
	        case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
	            toastMsg( getTrans("Permission not requested",'permission_not_requested') );
	            break;
	        case cordova.plugins.diagnostic.permissionStatus.DENIED:			            
	            toastMsg( getTrans("Permission denied",'permission_denied') );
	            break;
	        case cordova.plugins.diagnostic.permissionStatus.GRANTED:
	            resetToPage($page_next);
	            break;
	        case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
	            resetToPage($page_next);
	            break;
	    }
	}, function(error){
	    showToast(error ,'danger');
	}, cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS); 			
};

getPermissionMessage = function(){
	$data = getStorage("background_message");
	if(!empty($data)){
	  $data_json = JSON.parse($data);
	  return $data_json;
	}
	return false;	
};

openPrivacyPolicy = function(){	
	$privacy_link = 'javascript:;'; 
	$settings = getStorage("privacy_policy_link"); 
	
	if ((typeof  $settings !== "undefined") && ( $settings !== null)) {
	  	  if(!empty($settings)){
	  	  	  $privacy_link = $settings;
	  	  }
	}  	
	browseLink($privacy_link);
};

browseLink = function(url){
	if(!empty(url)){
		if (isDebug()){
		    window.open(url);		   
		} else {
			browse_inapp = cordova.InAppBrowser.open( url  , '_blank', 'location=no' );
		}
	}
};
