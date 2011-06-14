var Packages = function () {};

Packages.prototype = (function() {
    var INFO_KEY_PREFIX = "PK_";
    var PACK_KEY = "Packages";
    var monitorInterval = null;
    
	var getStoredData = function (name){
		return JSON.parse(localStorage.getItem(name));
	};

	var setStoredData = function (name, data){
		localStorage.setItem(name, JSON.stringify(data));
	};
	
	var loadPackageInfo = function (packageCode, infoReceived){
		// TODO: Tratar pacotes não encontrados no site
		var url = "http://websro.correios.com.br/sro_bin/txect01$.QueryList?P_LINGUA=001&P_TIPO=001&P_COD_UNI="+packageCode;
		$.get(url, function(data){
			var receivedHtml = $(data);
			var statuses = [];
			$("table  tr:gt(0)", receivedHtml).each(function(){        
				var line = $(this);
				var columns = line.children("td");
				if (columns.length == 3) {
					statuses.push({
							  date: $(columns[0]).text().trim(),
							  status: $(columns[2]).text().trim(), 
							  description: ''
							});
				} else if (columns.length == 1) {
					if (statuses.length > 0){
						statuses[statuses.length-1].description = $(columns[0]).text().trim();
					}
				}
			});

			if (infoReceived) {
				infoReceived(statuses);
			}    
		})
		.error(function(r,m,e){alert("Erro: " + m);});
	};
	
	var setPackageInfo = function(packageCode, info){
		setStoredData(INFO_KEY_PREFIX + packageCode, info);
	};
	
	var setPackages = function(packageList){
		setStoredData(PACK_KEY, packageList);
	};			
	
    return {
		packageInfoUpdated : function () {
		},
		
		packageStatusUpdated : function(packageCode, info) {
		},
		
		getPackages : function(){
			var packages = getStoredData(PACK_KEY);
			if (!packages) packages = {items:[]};
			return packages;
		},
		
		getPackageList : function (){			
			return this.getPackages();
		},	
			
		getPackageInfo: function(packageCode){
			return getStoredData(INFO_KEY_PREFIX + packageCode);
		},	
		
		addPackage: function(packageCode, packageName){
			var packageList = this.getPackages();
			if ($.inArray(packageCode, packageList.items) != -1){
				return false;
			}
			packageList.items.push(packageCode);   
			
			if (!packageName || $.trim(packageName).length == 0){
				packageName = packageCode;
			}
			var info = {name:packageName, code:packageCode};
			setPackages(packageList);
			setPackageInfo(packageCode, info);
			this.packageInfoUpdated();
			
			var that = this;
			loadPackageInfo(packageCode, function(statuses){
				info.statuses = statuses;
				setPackageInfo(packageCode, info);
				that.packageInfoUpdated();
			});
			
			return true;
		},
		
		removePackage: function(packageCode){
			var packageList = this.getPackages();
			var index = $.inArray(packageCode, packageList.items);
			if (index != -1){
				localStorage.removeItem(INFO_KEY_PREFIX + packageCode);
				packageList.items.splice(index, 1);
				setPackages(packageList);	
				this.packageInfoUpdated();		
			}
		},	
		
		checkPackagesUpdate : function(){
			var packages = this.getPackageList();
			for(i=0;i<packages.items.length;i++){
				this.checkPackageUpdate(packages.items[i]);
			}
		}		,
		
		checkPackageUpdate : function(packageCode){
			var that = this;
			loadPackageInfo(packageCode, function(statuses){
				if (!statuses || statuses.length == 0){
					// TODO: O que fazer quando o item ainda não é visível no site ou não existe?
					return;			
				}
				var statusChanged = true;
				var currentStatus = statuses[0].date;
				
				var info = that.getPackageInfo(packageCode);
				if (info && info.statuses.length > 0){
					var lastStatus = info.statuses[0].date;
					statusChanged = lastStatus != currentStatus;
				}
				
				info.statuses = statuses;
				
				setPackageInfo(packageCode, info);
				
				if (statusChanged){
					that.packageInfoUpdated();
					that.packageStatusUpdated(packageCode, info);
				}			
			});
		},
			
		getWaitTime : function(){
			return parseInt(localStorage["waitTime"] || "30"); 
		},
		
		setWaitTime : function(time){
			localStorage["waitTime"] = time;
			if (monitorInterval){
				this.stopMonitoring();
				this.starMonitoring();
			}
		},
		
		starMonitoring : function(){
		     var time = this.getWaitTime() * 60 * 1000;
			 monitorInterval = window.setInterval(function() {  
				packs.checkPackagesUpdate();
			 }, time);
		},
		
		stopMonitoring : function(){
			if (monitorInterval){
				clearInterval(monitorInterval);
				monitorInterval = null;
			}
		}		
	};    
})();