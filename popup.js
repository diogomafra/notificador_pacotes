var packs = chrome.extension.getBackgroundPage().packs;

$(function(){
	updatePackageScreen();
});

function addPackage(){
	var packageCode = $("#packageCode").val();
	var packageName = $("#packageName").val();
	if (!packageCode){
		alert("Informe o código");
		return;
	}
	
	var packages = packs.getPackageList();
	if ($.inArray(packageCode, packages.items) != -1){
		alert("Código já cadastrado");
		return;
	}

	if (packs.addPackage(packageCode, packageName)){
		updatePackageScreen();   
		$("#packageCode").val("");
		$("#packageName").val("");
		$("#packageCode").focus();
	}
}

function removePackage(packageCode){
	if (confirm("Realmente deseja remover esse pacote?")){
		packs.removePackage(packageCode);
		updatePackageScreen();
	}
}
	
function updatePackageScreen(){
	var packages = packs.getPackageList();
   
	if (packages.items.length == 0) {
		$("#packageList").html("<div class='noPackages'>Nenhum pacote cadastrado</div>");
	} else {
	   var items = [];
	   for(i=0;i<packages.items.length;i++){
			var packageCode = packages.items[i];
			var pack = packs.getPackageInfo(packageCode);
			var status = {status: "Verificando...", date: "", description: ""};
			if (pack && pack.statuses && pack.statuses.length > 0){
				status = pack.statuses[0];
			}
			
			items.push({
				name: pack.name,
				code: pack.code,
				lastStatusDate: status.date,
				lastStatusDesc: status.description,
				lastStatusName: status.status
			});
	   }
	   
	   $("#packageList").html("");
	   $("#packageTemplate").tmpl(items).appendTo("#packageList");   
	}
}

function showPackageDetails(packageCode){
	var package1 = packs.getPackageInfo(packageCode);
	
	$("#defaultScreen").hide();	
	$("#packageDetails").html("");
	$("#packageDetailsTemplate").tmpl(package1).appendTo("#packageDetails");   	
	$("#packageDetails").show();
}

function backToList(){
	$("#packageDetails").hide();
	$("#defaultScreen").show();
}