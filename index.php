<?php require_once 'header.php'; ?>
<main class="ng-cloak ng-controller ng-scope" ng-controller="mapController">
	<aside class="nav-wrap" id="sidebar-wrapper">
		<nav class="clearfix ng-scope site-nav" role="navigation">
			<div class="clearfix"></div>
			
			<form method="POST" name="form" id="form" autocomplete="off" ng-submit="submit()" ng-model="form" role="form">
				<fieldset class="scroll" ui-sortable="sortableOptions" ng-model="directions" ui-sortable-update="expression">
					<div ng-repeat="direction in directions">
						<div class="first-user" id="locationField">
							<div id="span-circle" class="handle">
								<span><i class="fas fa-map-pin" aria-hidden="true"></i></span>
							</div><!--/ .handle -->
							<input id="metro" type="text" name="metro" vs-google-autocomplete class="form-control metro autocomplete" ng-model="directions[$index].location" placeholder="Add City/Metro (e.g. San Diego, CA MSA)" ng-model-options="{ updateOn: 'default', updateOnDefault: true }">
							<button class="btn-transparent" id="deleteButton" type="button" id="delete_stop" ng-click="deleteField($index)" ng-if="removeButton" ng-model="removeButton">
								<i class="fa fa-minus-circle" aria-hidden="true"></i>
							</button>
						</div><!--/ .first-user -->
					</div><!-- /ng-repeat -->
				</fieldset><!--/ .scroll -->
				<div class="second-user">
					<button class="btn btn-lined" id="addbutton" type="button" id="add_stop" ng-click="addField(metro)" ng-model="addbutton"><i class="fa fa-plus-circle" aria-hidden="true"></i></button>
					<button type="submit" class="btn submit btn-lined" ng-submit="submit()">Route Trip</button>
				</div><!--/ .first-user -->
			</form><!--/ .form -->
			<div ui-view></div>
		</nav><!--/ .clearfix -->
	</aside><!--/ .nav-wrap -->
	<div class="content-container">
		<div class="page">
			<div class="page-wrap">
				<div class="container">
					<div class="row">
						<div class="max-width">
							<div id="map"></div>
						</div><!--/ .col-md-10 -->
						<div class="dossier">
							<div id="mileage"></div>
							<div id="distance"></div>

							<ul id="distances">
								<ol>Duration times</ol>
							</ul><!--/ .distances -->
							<div id="results"></div>
						</div><!--/ .dossier -->			
					</div><!--/ .row -->
				</div><!--/ .container -->
			</div><!--/. page-wrap -->
		</div><!--/ .page -->
	</div><!--/ .content-container -->
</main>
<?php require_once 'footer.php'; ?>