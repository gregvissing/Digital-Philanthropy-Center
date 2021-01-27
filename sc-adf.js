/*
 █████  ██████  ███████
██   ██ ██   ██ ██
███████ ██   ██ █████
██   ██ ██   ██ ██
██   ██ ██████  ██

Advanced Donation Form (Blackbaud Checkout)
====================================================================
Client: University of South Carolina
Author(s): Mark Hillard
Product(s): BBIS
Created: 09/29/2019
Updated: 03/26/2020


CHANGELOG
====================================================================
09/29/2019: Initial build
01/13/2020: Accessibility updates (USC added)
01/14/2020: Updated token handling for checkout completion
03/20/2020: Added functionality for single fund forms
03/26/2020: Updated GUIDS to reflect Production IDs
05/38/2020: Updated code for passing a GUID to the direct your gift form
            to auto populate the gift designation.
            Added code to allow for single fund donation pages.
09/11/2020: Changed Bloodhound tokenizer to use nonword instead of whitespace.
10/02/2020: Added the ability to pass categry, sub-categry, gift amount, 
            recurring gift (y/n), frequency and appeal via URL params. This allows
            for the link builder page to work.
10/21/2020: 1477 Twitter Handle field added (Athletics)
11/18/2020: Added HEP Company lookup and CompanyID attribute to gift record
            Added referring URL and Page URL attributes to gift record
11/20/2020: Disable submit button after it has been clicked and until the paymenr
            screen has been closed. This will prevent double record entry in CRM.
*/


var ADF = ADF || {
    Defaults: {


        // PRODUCTION Values
        // api
        rootPath: BLACKBAUD.api.pageInformation.rootPath,
        pageId: BLACKBAUD.api.pageInformation.pageId,
        pageName: $.trim($(document).find('title').text()),
        partId: $('.BBDonationApiContainer').data('partid'),

        // designation queries
        fundListQuery: '612a82e8-24c8-4ae1-9aee-d5a006750507', // '5aa1585c-7ee8-43c6-a944-5912108d78b0',
        fundSearchQuery: '612a82e8-24c8-4ae1-9aee-d5a006750507', // '413a5313-b370-45da-9a24-34aff1362c9b',
        desgPageQuery: '52a959d0-5baf-429f-b2df-93f9a070e1a1',

        // custom attributes
        comments: 'E3FE7CF0-7FFD-447A-979D-E73467EF94D6',
        matchingGift: '6840AED0-B85C-41C0-BB06-35DF318ABF0F',
        matchingGiftCompanyName: 'D3B38498-306A-4FD5-8F5F-07039334D208',
        matchingGiftCompanyID: 'AF1D7220-0853-4453-9567-6E69CCC415B2',

        usc: '6FA8428D-154C-493B-8513-F202D9A26E0B',
        uscCampus: 'E5844BEF-1BD5-443B-A698-14013B2DC994',
        uscCollege: 'D513D3BE-73DB-4C5F-A4FB-7A39774BF2B7',
        uscDept: '36BAAB76-A78D-4D84-952F-E920ED71A0AB',

        //Production
        referringURL: '5F01E0ABF4154346BA332987770ED1D1',
        pageURL: '4B2681DBEDFB471AA25EA4B0E607FFFC',

        //Test
        //referringURL: '3AC96D50A3884BE0AFBD1E441652B391',
        //pageURL: 'CE37A678EB8C481A89E6287B51B160CD',

        //Zipcode lookup URL
        zipurl: 'https://secure.shippingapis.com/ShippingAPI.dll?API=CityStateLookup&XML=',

        // code tables
        titleTable: '456ffd4c-0fbf-49db-a503-0726f86e2a39',
        defaultCountry: '00cb6cdb-f6cf-44e2-9c73-51ddf7965d8f',

        // server date
        serverDate: new Date($('.BBDonationApiContainer').attr('serveryear'), $('.BBDonationApiContainer').attr('servermonth') - 1, $('.BBDonationApiContainer').attr('serverday')),

        // keys
        publicKey: '',
        hepKey: 'c158149ee05a1',
        // Production
        hepFile: 'https://donate.sc.edu/file/hep.json',

        //Test
        //hepFile: 'https://bbis50304t.sky.blackbaud.com/file/hep.json',

        // merchant account
        merchantAccountId: '',

        // checkout overlay
        opened: false,
        editorContent: '',
        checkoutError: 'There was an error while performing the operation. The page will be refreshed.',

        // order id
        orderId: ''
    },

    Methods: {
        pageInit: function() {
            // runs on partial page refresh
            Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(function() {
                ADF.Methods.pageRefresh();
            });

            // runs on full page load
            $(document).ready(function() {
                ADF.Methods.pageLoad();
            });
        },

        // page refresh
        pageRefresh: function() {

            // nothing to see here...
        },

        // full page load
        pageLoad: function() {
            if ($('.BBDonationApiContainer').length !== 0) {
                ADF.Methods.hiddenForm();
                ADF.Methods.getPublicKey();
                ADF.Methods.getEditorInformation();
                ADF.Methods.initAdf();
                ADF.Methods.buttonGroup();
                ADF.Methods.matchingGiftSearch();
                ADF.Methods.validationMarkers();
                ADF.Methods.giftOptions();
                ADF.Methods.getCountryState();
                ADF.Methods.getTitle();
                ADF.Methods.datePicker();
                ADF.Methods.calculateInstallments();
                ADF.Methods.matchingGiftSearch();

                // if only single fund
                if ($('#fund').length !== 0 && !$('#fund').is(':empty')) {
                    ADF.Methods.singleFund();
                    //console.log("sfp");
                } else {
                    //console.log("mfp");
                    ADF.Methods.fundList(ADF.Methods.fundSearch);
                    ADF.Methods.procFee();
                }

                // add aria attributes for accessibility on expand/collapse
                $('.js-tab-target').each(function(index) {
                    var i = index + 1;
                    if ($(this).hasClass('accordion-summary')) {
                        $(this).find('span').first().attr('id', 'accordion-header' + i);
                    } else {
                        $(this).closest('li').find('span').attr('id', 'accordion-header' + i);
                    }
                    $(this).attr({
                        'aria-controls': 'accordion-content' + i,
                        'aria-expanded': 'false'
                    });
                    $(this).next().attr({
                        'id': 'accordion-content' + i,
                        'aria-labelledby': 'accordion-header' + i
                    });
                });
            }
        },

        // returns a single value from the URL (pass in name of value)
        returnQueryValueByName: function(name) {
            var url = new URL(window.location.href);
            var val = url.searchParams.get(name);
            if (val != "" && val != null) {
                if (val.includes("?")) {
                    newval = val.split("?");
                    val = newval[0];
                }
            }
            return val;
            //return BLACKBAUD.api.querystring.getQueryStringValue(name);
        },

        // returns all query string parameters from a URL
        getUrlVars: function(url) {
            var vars = [],
                hash, hashes = url.slice(url.indexOf('?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        },

        // hidden checkout form
        hiddenForm: function() {
            if ($('form[data-formtype="bbCheckout"]').length <= 0) {
                var form = '<form method=\'get\' id=\"paymentForm\" data-formtype=\'bbCheckout\' data-disable-submit=\'true\' novalidate><\/form>';
                $('body').prepend(form);
            }
        },

        // get public key
        getPublicKey: function() {
            var onPublicKeySuccess = function(data) {
                ADF.Defaults.publicKey = JSON.parse(data.Data).PublicKey;
            };

            var onPublicKeyFailure = function(error) {
                console.log(error);
            };

            donationService.getCheckoutPublicKey(onPublicKeySuccess, onPublicKeyFailure);
        },

        // get editor information
        getEditorInformation: function() {
            var partId = ADF.Defaults.partId;

            var onEditorContentSuccess = function(content) {
                ADF.Defaults.editorContent = content;
                ADF.Defaults.merchantAccountId = content.MerchantAccountID;
            };

            var onEditorContentFailure = function(error) {
                console.log(error);
            };

            donationService.getADFEditorContentInformation(partId, onEditorContentSuccess, onEditorContentFailure);
        },

        // get confirmation html
        getConfirmation: function(id) {
            var confirmationSuccess = function(content) {
                var title = $(document).prop('title');
                $(document).prop('title', 'Thank you for your gift | ' + title);
                $('#adfWrapper').hide();
                $('#giftAmount').hide();
                $('#commentsSection').hide();
                $('#giftOptions').hide();
                $('#billingInfo').hide();
                $("#giftSummary").hide();
                $("#pg1Btns").hide()
                $("#pg2Btns").hide()
                $("#pg3Btns").hide()
                $('#adfConfWrapper').removeClass('hidden').html(content);
            };

            var confirmationError = function(error) {
                $('#adfWrapper').hide();
                $('#giftAmount').hide();
                $('#commentsSection').hide();
                $('#giftOptions').hide();
                $('#billingInfo').hide();
                $("#giftSummary").hide();
                $("#pg1Btns").hide()
                $("#pg2Btns").hide()
                $("#pg3Btns").hide()
                $('#adfConfWrapper').removeClass('hidden').html('<p>' + ADF.Methods.convertErrorsToHtml(error) + '</p>');
            };

            donationService.getDonationConfirmationHtml(id, confirmationSuccess, confirmationError);
        },

        // process credit card payment
        processCCPayment: function(data) {
            var onValidationSuccess = function() {
                ADF.Methods.makePayment(data);
                return false;
            };

            var onValidationFailed = function(error) {
                $('#adfError').html('<span class="fas fa-exclamation-circle"></span><p>' + ADF.Methods.convertErrorsToHtml(error) + '</p>');
                $('#adfError').show();
            };

            donationService.validateDonationRequest(data, onValidationSuccess, onValidationFailed);
        },

        // create donation for pledge (bill me later)
        billMeLater: function(data) {
            var donationSuccess = function(data) {
                ADF.Methods.getConfirmation(data.Donation.Id);
            };

            var donationFail = function(error) {
                $('#adfError').html('<span class="fas fa-exclamation-circle"></span><p>' + ADF.Methods.convertErrorsToHtml(error) + '</p>');
                $('#adfError').show();
            };

            donationService.createDonation(data, donationSuccess, donationFail);
        },

        // blackbaud checkout (credit card)
        makePayment: function(data) {
            // reset openend status
            ADF.Defaults.opened = false;

            var handleCheckoutComplete = function(event, token) {
                if (event && event.detail && event.detail.transactionToken) {
                    // complete donation
                    data.TokenId = event.detail.transactionToken;
                    donationService.checkoutDonationComplete(data, handlePaymentComplete, handleDonationCreateFailed);

                    // show overlay
                    $('#bbcheckout-iframe-wrapper').addClass('processing');
                } else {
                    ADF.Methods.handleError();
                }

                ADF.Methods.unBindPaymentCheckoutEvents();
                return false;
            };

            var handleCheckoutError = function() {
                ADF.Methods.handleError();
                $('#adfSubmit').prop("disabled", false)
            };

            var handleCheckoutCancelled = function() {
                try {
                    donationService.checkoutDonationCancel(data, onSuccess, onFail);
                    $('#adfSubmit').prop("disabled", false)
                } catch (err) {
                    // nothing to see here...
                }

                ADF.Methods.unBindPaymentCheckoutEvents();
            };

            var handleCheckoutLoaded = function() {
                if (!ADF.Defaults.opened) {
                    // set opened status
                    ADF.Defaults.opened = true;

                    // get transaction id
                    var url = $('#bbcheckout-iframe').attr('src'),
                        tid = ADF.Methods.getUrlVars(url).t;

                    if (tid) {
                        data.TokenId = tid;
                        donationService.checkoutDonationCreate(data, handleDonationCreated, handleDonationCreateFailed);
                        return false;
                    }
                }

                return false;
            };

            var handleDonationCreated = function(data) {
                // get order id
                ADF.Defaults.orderId = JSON.parse(data.Data).OrderId;
            };

            var handleDonationCreateFailed = function() {
                ADF.Methods.handleError();
            };

            var handlePaymentComplete = function(data) {
                // hide overlay
                $('#bbcheckout-iframe-wrapper').removeClass('processing');

                // show confirmation html
                $('#adfWrapper').hide();
                $('#giftAmount').hide();
                $('#commentsSection').hide();
                $('#giftOptions').hide();
                $('#billingInfo').hide();
                $("#giftSummary").hide();
                $("#pg1Btns").hide()
                $("#pg2Btns").hide()
                $("#pg3Btns").hide()
                $('#adfConfWrapper').removeClass('hidden').html(JSON.parse(data.Data).confirmationHTML);
            };

            // checkout service
            var checkout = new SecureCheckout(handleCheckoutComplete, handleCheckoutError, handleCheckoutCancelled, handleCheckoutLoaded),
                donor = data.Donor,
                checkoutData = {
                    Amount: $('.total-amount span').text().replace('$', '').replace(',', ''),
                    BillingAddressCity: donor.Address.City,
                    BillingAddressCountry: donor.Address.Country,
                    BillingAddressEmail: donor.EmailAddress,
                    BillingAddressFirstName: donor.FirstName,
                    BillingAddressLastName: donor.LastName,
                    BillingAddressLine: donor.Address.StreetAddress,
                    BillingAddressPostCode: donor.Address.PostalCode,
                    BillingAddressState: donor.Address.State,
                    Cardholder: donor.FirstName + ' ' + donor.LastName,
                    ClientAppName: 'University of South Carolina ADF',
                    FontFamily: ADF.Defaults.editorContent.FontType,
                    IsEmailRequired: true,
                    IsNameVisible: true,
                    MerchantAccountId: ADF.Defaults.editorContent.MerchantAccountID,
                    PrimaryColor: ADF.Defaults.editorContent.PrimaryFontColor,
                    SecondaryColor: ADF.Defaults.editorContent.SecondaryFontColor,
                    UseApplePay: ADF.Defaults.editorContent.UseApplePay,
                    UseCaptcha: ADF.Defaults.editorContent.RecaptchRequired,
                    UseMasterpass: ADF.Defaults.editorContent.UseMasterPass,
                    UseVisaCheckout: ADF.Defaults.editorContent.UseVisaPass,
                    key: ADF.Defaults.publicKey
                };

            // set card token (recurring gift)
            if (data.Gift && data.Gift.Recurrence) {
                checkoutData.CardToken = ADF.Defaults.editorContent.DataKey;
            }

            // process today or later (recurring gift)
            if (data.Gift && data.Gift.Recurrence && !data.Gift.Recurrence.ProcessNow) {
                return checkout.processStoredCard(checkoutData);
            } else {
                return checkout.processCardNotPresent(checkoutData);
            }
        },

        // handle generic checkout error
        handleError: function() {
            alert(ADF.Defaults.checkoutError);
            window.location.reload(true);
        },

        // unbind checkout events
        unBindPaymentCheckoutEvents: function() {
            $('#adfSubmit').prop("disabled", false)
            $(document).unbind('checkoutComplete');
            $(document).unbind('checkoutLoaded');
            $(document).unbind('checkoutError');
            $(document).unbind('checkoutCancel');
        },

        // initialize ADF
        initAdf: function() {
            // legacy browser support for placeholder attributes
            $('input:not(".tt-hint"), textarea').placeholder();

            // character counter (comments)
            $('#comments').limit('#comments + .char-counter span');

            // zipcode entered
            $('#personalZip').on('blur', function(e) {
                if ($("#personalCountry option:selected").text() == "United States") {
                    var reqxml = "<CityStateLookupRequest USERID='766UNIVE1005'><ZipCode ID='0'><Zip5>" + $('#personalZip').val().substring(0, 5) + "</Zip5></ZipCode ></CityStateLookupRequest>";
                    var rurl = ADF.Defaults.zipurl + encodeURI(reqxml);

                    $.ajax({
                        type: "GET",
                        url: rurl,
                        dataType: "xml",
                        success: function(data) {
                            var st = $(data).find("State").text();
                            if (st != null && st != "") { $('#personalState').val(st); }
                            if ($(data).find("City").text() != "" && $(data).find("City").text() != null) { $('#personalCity').val(toTitleCase($(data).find("City").text())); }
                        }
                    });
                }

            });
            // submit button event
            $('#adfSubmit').on('click', function(e) {
                // prevent default action
                e.preventDefault();


                // form validation
                if ($('.fund-card.empty').is(':visible')) {
                    $('#adfError').html('<span class="fas fa-exclamation-circle"></span><p>Please select a fund from above and enter an amount.</p>');
                    $('#adfError').show();
                } else if (ADF.Methods.validateADF()) {
                    $(this).prop("disabled", true);
                    // hide error
                    $('#adfError').hide();

                    // get donation data
                    var data = ADF.Methods.getDonationData();

                    // credit card or bill me later
                    if (ADF.Defaults.editorContent && ADF.Defaults.editorContent.MACheckoutSupported && data.Gift.PaymentMethod === 0) {
                        ADF.Methods.processCCPayment(data);
                    } else {
                        ADF.Methods.billMeLater(data);
                    }

                } else {
                    // reset error
                    $('#adfError').html('<span class="fas fa-exclamation-circle"></span><p>Some required information is missing. Form submission is disabled until all required information is entered.</p>');
                }
            });
        },

        // button group functionality
        buttonGroup: function() {
            var button = $('.button-group .btn');

            // toggle active class
            button.on('click', function() {
                $(this).addClass('active');
                $(this).siblings().removeClass('active');
            });
        },

        singleFund: function() {
            var guid = ADF.Methods.returnQueryValueByName('fund');
            if (guid == null || guid == "") {
                guid = ADF.Methods.returnQueryValueByName('id');
            }
            if (!!guid) {
                ADF.Methods.desgPage();
            } else {
                // Show ADF	
                $('#adfWrapper').attr('aria-busy', "false");
                $('#temp-message').hide();
                $('#adfForm').show();
            }
            // add guid to fund card
            $('.single-fund .fund-guid').text($('#fund').text());

            // amount button click event
            $('.amount-button').on('click', function(e) {
                // prevent default action
                e.preventDefault();

                var amount = $(this).data('amount');

                if (amount === 'other') {
                    // show other amount
                    $('#otherAmount').show();
                    $('#otherAmountInfo').show();

                    // reset amount
                    $('.single-fund input').val('').change();
                } else {
                    // hide other amount
                    $('#otherAmount').hide();
                    $('#otherAmountInfo').hide();

                    // populate amount
                    $('.single-fund input').val(amount).change();
                }

                // toggle active class
                $(this).addClass('active');
                $(this).siblings().removeClass('active');

                // update total
                ADF.Methods.updateTotal();
            });

            // other amount update
            $('.single-fund input').on('change keyup focusout input paste', function() {
                // remove active button class
                $('.amount-button').not('.amount-button[data-amount="other"]').removeClass('active');

                // update total
                ADF.Methods.updateTotal();
            });
        },

        desgPage: function() {

            // show overlay	
            $('#bbcheckout-iframe-wrapper').addClass('processing');
            $('#bbcheckout-spinner').append("<p id='loading-message'><font color='white'>Loading form</font></p>");
            //$('#bbcheckout-spinner').insertAfter("<h3 id='loadingMessage'><font color='white'>Setting up the gift form.</font></h3>");	

            var guid = ADF.Methods.returnQueryValueByName('fund');
            if (guid == null || guid == "") {
                guid = ADF.Methods.returnQueryValueByName('id');
            }
            var query = new BLACKBAUD.api.QueryService(),
                results = [];
            var name, id, descr, cat, subcat;
            ADF.Defaults.desgPageQuery += "?System%20record%20ID=" + guid;
            //console.log(ADF.Defaults.desgPageQuery);	
            // get results	
            start = Date.now();
            query.getResults(ADF.Defaults.desgPageQuery, function(data) {
                // clean results	
                var fields = data.Fields,
                    rows = data.Rows,
                    fieldArray = [];
                $.each(fields, function(key, value) {
                    fieldArray[value.Name] = key;
                });
                gotResults = Date.now();
                if (this.Values == null) {
                    $('#temp-message').hide();
                    $('#adfForm').show();
                    $('#bbcheckout-iframe-wrapper').removeClass('processing');
                    $('#loading-message').html("Form loaded");
                    $('#loading-message').hide();
                    $('#adfWrapper').attr('aria-busy', "false");
                }
                $.each(rows, function() {
                    var values = this.Values;
                    if (name == null) {
                        name = values[4];
                        id = values[0];
                        descr = values[3];
                        cat = values[5];
                        subcat = values[6];
                        $("#intro").text(descr);
                        $("#introTitle").text("Make a gift to the " + name);
                        $("#fund").text(id);
                        $("#fundcat").text(cat + " / " + subcat);
                        $("#fundName").text(name);
                        // hide overlay	
                        $('#loading-message').html("Form loaded");
                        $('#loading-message').hide();
                        $('#bbcheckout-iframe-wrapper').removeClass('processing');
                        $('#adfWrapper').attr('aria-busy', "false");

                    }
                    $('#loading-message').html("Form loaded");
                    $('#temp-message').hide();
                    $('#adfForm').show();
                    $('#adfWrapper').attr('aria-busy', "false");

                    results.push({
                        name: values[4],
                        id: values[0],
                        descr: values[3],
                        cat: values[5],
                        subcat: values[6]
                    });
                });
                // filter unique values	
                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }
            });
        },


        // fund list
        fundList: function(callback) {
            // show overlay	
            $('#bbcheckout-iframe-wrapper').addClass('processing');
            $('#bbcheckout-spinner').append("<p id='loading-message'><font color='white'>Loading form</font></p>");
            $('#adfWrapper').attr('aria-busy', "true");
            //console.log("Starting Accordian");
            // fund list container
            var fundList = $('#fundList');
            var start;
            var gotResults;
            var startFormat;
            var endFormat;
            // designation variables

            var query = new BLACKBAUD.api.QueryService(),
                results = [];

            var catFilter = ADF.Methods.returnQueryValueByName('cat');
            //console.log("cat: " + catFilter);
            //console.log(encodeURIComponent(catFilter));
            var subcatFilter = ADF.Methods.returnQueryValueByName('subcat');

            var filterArray = [];
            if (!!catFilter) {
                filterArray.push({ "columnName": "BBIS Online Designation Category Attribute\\Value", "value": catFilter });
            }

            if (!!subcatFilter) {
                filterArray.push({ "columnName": "BBIS Online Designation Subcategory Attribute\\Value", "value": subcatFilter });
            }

            //console.log(filterArray);
            // get results
            start = Date.now();
            query.getResults(ADF.Defaults.fundListQuery, function(data) {
                // clean results
                var fields = data.Fields,
                    rows = data.Rows,
                    fieldArray = [];

                $.each(fields, function(key, value) {
                    fieldArray[value.Name] = key;
                });
                gotResults = Date.now();
                $.each(rows, function() {
                    var values = this.Values;
                    results.push({
                        name: values[3],
                        id: values[5],
                        cat: values[1],
                        subcat: values[2]
                    });
                });

                // filter unique values
                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }

                // get categories
                var category = results.map(function(obj) {
                    return obj.cat;
                });

                startFormat = Date.now();
                // populate unique categories
                var uniqueCat = category.filter(onlyUnique);
                $.each(uniqueCat, function(key1, value1) {
                    // build html structure for categories

                    fundList.append('\
                        <div    class="des-block" aria-expanded="false">\
                            <div	tabindex="0" \
                                    aria-expanded="false" \
                                    aria-controls="accordian-cat-content' + key1 + '"\
                                    id="accordian-cat-header' + key1 + '"\
                                    class="des-cat cat-' + key1 + '">' + value1 + '</div>\
                            <div id="accordian-cat-content' + key1 + '"\
					             role="list"\
					             class="des-group"></div>\
                        </div>\
                    ');

                    // filter categories
                    var filterCat = $.grep(results, function(v) {
                        return v.cat === value1;
                    });

                    // get sub-categories from category filter
                    var subCategory = filterCat.map(function(obj) {
                        return obj.subcat;
                    });

                    // populate unique sub-categories
                    var uniqueSubCat = subCategory.filter(onlyUnique);
                    $.each(uniqueSubCat, function(key2, value2) {
                        // build html structure for sub-categories

                        fundList.find('.cat-' + key1).next().append('\
                            <div class="des-area" role="listitem">\
                                <div tabindex="0" \
                                     aria-labbelledby="accordian-cat-header' + key1 + '"\
                                     aria-controls="accordian-cat-' + key1 + 'subcat-' + key2 + '"\
                                     class="des-subcat subcat-' + key2 + '">' + value2 + '</div>\
                                <div class="des-select"\
						             role="list"\
						             id="accordian-cat-' + key1 + 'subcat-' + key2 + '"\></div>\
                            </div>\
                        ');

                        // filter designations
                        var filterDes = $.grep(results, function(v) {
                            return v.cat === value1 && v.subcat === value2;
                        });

                        // populate designations
                        $.each(filterDes, function(key3, value3) {
                            var desId = value3.id,
                                desName = value3.name,
                                desCat = value3.cat,
                                desSubcat = value3.subcat,
                                desInput = value3.id

                            // build html structure for designations
                            fundList.find('.cat-' + key1).next().find('.subcat-' + key2).next().append('\
                                <div class="checkbox">\
                                    <input  type="checkbox"\
								            aria-labelledby="value-' + desId + '"\
                                            onfocus="parentFocus(event)"\
                                            onblur="parentBlur(event)"\
                                            tabindex="0"\
								            id="' + desId + '"\
                                            value="' + desId + '"\
								            onclick="checkboxPressed(event)"\
                                            data-cat="' + desCat + '"\
                                            data-subcat="' + desSubcat + '"\
								            aria-controls="giftSummary">\
                                    <label  for="' + desId + '"\
								            id="value-' + desId + '">' + desName + '</label>\
                                </div>\
                            ');
                        });
                    });

                });
                endFormat = Date.now();

                //console.log(`Time to load query: ${Math.floor((gotResults - start)/1000)}`);
                //console.log(`Time to format table: ${Math.floor((endFormat - startFormat)/1000)}`);

                // run fund selection
                ADF.Methods.fundCards();
                if (!!catFilter) {
                    //console.log("Catfilter: ", catFilter, ".");
                    $(".des-cat").click()
                }
                if (!!subcatFilter) {
                    //console.log("Subcatfilter: ", subcatFilter, ".");
                    $(".des-subcat").click()
                }
                //console.log("finished accordion");
                callback();
            }, function() {}, filterArray);
        },

        // fund search
        fundSearch: function() {
            //console.log("starting search");
            // typeahead variables
            var typeahead = $('#desSearch'),
                query = new BLACKBAUD.api.QueryService(),
                results = [];

            var catFilter = ADF.Methods.returnQueryValueByName('cat');
            //console.log("cat: " + catFilter);
            //console.log(encodeURIComponent(catFilter));
            var subcatFilter = ADF.Methods.returnQueryValueByName('subcat');

            var filterArray = [];
            if (!!catFilter) {
                filterArray.push({ "columnName": "BBIS Online Designation Category Attribute\\Value", "value": catFilter });
            }

            if (!!subcatFilter) {
                filterArray.push({ "columnName": "BBIS Online Designation Subcategory Attribute\\Value", "value": subcatFilter });
            }


            // get results
            query.getResults(ADF.Defaults.fundSearchQuery, function(data) {
                // clean results
                results = [];
                var fields = data.Fields,
                    rows = data.Rows,
                    fieldArray = [];

                $.each(fields, function(key, value) {
                    fieldArray[value.Name] = key;
                });
                //was 3
                $.each(rows, function() {
                    var values = this.Values;
                    results.push({
                        value: values[4],
                        label: values[3] + " ( " + values[5] + " )",
                        cat: values[1],
                        subcat: values[2]
                    });
                });

                // initialize suggestion engine
                // Changed tokenizers from whitespace to nonword	
                var search = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.nonword('label', 'cat', 'subcat'),
                    queryTokenizer: Bloodhound.tokenizers.nonword,
                    local: results
                });

                // initialize typeahead plugin
                var typeaheadInit = search.initialize();
                typeaheadInit.done(function() {
                    typeahead.typeahead({
                        highlight: true,
                        minLength: 2
                    }, {
                        display: 'label',
                        name: 'search',
                        source: search,
                        limit: 'Infinity',
                        templates: {
                            empty: function() {
                                return '<div class="no-match">No results found</div>';
                            },
                            suggestion: function(data) {
                                if (!data.cat) {
                                    return '<div><p class="tt-label">' + data.label + '</div>';
                                } else {
                                    return '<div><p class="tt-hierarchy">' + data.cat + ' / ' + data.subcat + '</p><p class="tt-label">' + data.label + '</div>';
                                }
                            }
                        }
                    }).on('typeahead:select', function(e, datum) {
                        $(this).data({
                            value: datum.value,
                            label: datum.label,
                            cat: datum.cat,
                            subcat: datum.subcat,
                            id: datum.value
                        });

                        ADF.Methods.addFund($(this));
                        clearSearch();
                    }).on('typeahead:change', function() {
                        if ($.trim($(this).typeahead('val')) === '') {
                            clearSearch();
                        }
                    });
                }).fail(function() {
                    console.log('unable to parse designation query');
                });

                // clear search field
                function clearSearch() {
                    typeahead.typeahead('val', '').typeahead('close');
                    typeahead.removeData();
                }

                // autopopulate designation from url
                var guid = ADF.Methods.returnQueryValueByName('fund');
                if (guid == null || guid == "") {
                    guid = ADF.Methods.returnQueryValueByName('id');
                }


                var giftAmt = ADF.Methods.returnQueryValueByName('giftAmt');
                var recurring = ADF.Methods.returnQueryValueByName('recurring');
                //console.log("recurring = ", recurring);
                var recurringFreq = ADF.Methods.returnQueryValueByName('freq');
                //console.log("recurringFreq = ", recurringFreq);
                if (recurring == '1') {
                    //console.log("This is a recurring gift")
                    $('#recurringGift').click();
                }
                if (recurring == "1" && recurringFreq > 1 && recurringFreq <= 4) {
                    //console.log("Frequency is ", recurringFreq);
                    $("#frequency").val(recurringFreq);
                }

                var appealGuid = ADF.Methods.returnQueryValueByName('appeal');
                if (!!appealGuid) {
                    $('#appeal').text(appealGuid);
                }

                if (!!guid) {

                    var label = results.filter(function(obj) {
                        //console.log(obj.value);	
                        return obj.value === guid;
                    })[0];
                    //console.log(label);	
                    typeahead.data('value', guid).typeahead('val', label.label);
                    $(typeahead).data({
                        value: label.value,
                        label: label.label,
                        cat: label.cat,
                        subcat: label.subcat,
                        id: label.value
                    });
                    //console.log($(typeahead));	
                    ADF.Methods.addFund($(typeahead));

                    if (!(isNaN(giftAmt)) && !!giftAmt) {
                        //console.log("Adding " + giftAmt + " to " + "#gift-amt" + guid);
                        var newVal = parseFloat(giftAmt, 10).toFixed(2);
                        $("#gift-amt" + guid).val(newVal);
                        $("#gift-amt" + guid).blur();
                        ADF.Methods.updateTotal();

                    }
                    clearSearch();
                    $('html, body').animate({
                        scrollTop: $('#giftSummary').offset().top
                    }, 300);
                }
                $('#temp-message').hide();
                $('#adfForm').show();
                $('#bbcheckout-iframe-wrapper').removeClass('processing');
                $('#loading-message').html("Form loaded");
                $('#loading-message').hide();
                $('#adfWrapper').attr('aria-busy', "false");
            }, function() {}, filterArray);
        },

        // matching gift search
        matchingGiftSearch: function() {
            var heptypeahead = $('#matchingGiftName'),
                query = new BLACKBAUD.api.QueryService(),
                results = [];

            // get results
            $.getJSON(ADF.Defaults.hepFile, function(data) {
                // clean results
                results = [];
                var fields = data.Fields,
                    rows = data.Rows,
                    fieldArray = [];

                $.each(fields, function(key, value) {
                    fieldArray[value.Name] = key;
                });
                //was 3
                $.each(rows, function() {
                    //console.log(this.Values);
                    var values = this.Values;
                    var pushResults = false;

                    results.push({
                        name: values[0],
                        id: values[1],
                        address: $.trim(values[2]) + "<br>" + $.trim(values[3]) + ", " + $.trim(values[4]) + " " + $.trim(values[5])
                    });

                });

                // initialize suggestion engine
                // Changed tokenizers from whitespace to nonword	
                var search = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.nonword('name', 'id', 'address'),
                    queryTokenizer: Bloodhound.tokenizers.nonword,
                    local: results
                });

                // initialize typeahead plugin
                var heptypeaheadInit = search.initialize();
                heptypeaheadInit.done(function() {
                    heptypeahead.typeahead({
                        highlight: true,
                        minLength: 2
                    }, {
                        display: 'name',
                        name: 'hepsearch',
                        source: search,
                        limit: 'Infinity',
                        templates: {
                            empty: function() {
                                return '<div class="no-match">No results found</div>';
                            },
                            suggestion: function(data) {
                                if (!data.id) {
                                    return '<div><p class="tt-label">' + data.name + '</div>';
                                } else {
                                    var tmpmsg = '<div><p class="tt-label" sytle="line-height: 1.7; margin-top:5px; font-size:1.1rem"><b>' + data.name + '</b></p><p class="tt-label" sytle="line-height: 1.7; margin-top:5px">' + data.address + '</div>';
                                    return tmpmsg;
                                }
                            }
                        }
                    }).on('typeahead:selected', function(e, datum) {

                        $("#matchingGiftName").typeahead('val', datum.name);
                        $($("#matchingGiftName").prev()).val(datum.name);
                        //$(".tt-menu").hide();
                        if ($("#matchingGiftID").length > 0) {
                            //console.log("element exist")
                            $("#matchingGiftID").val(datum.id)
                        } else {
                            //console.log("Adding hidden input")
                            $("#matchingGiftName").after("<input type='hidden' id='matchingGiftID' value='" + datum.id + "'>")
                        }
                        $("#matchingGiftName").typeahead('close');

                    }).on('typeahead:select', function(e, datum) {
                        //console.log("select: data: ", datum.name);
                        //$(this).data({
                        //    value: datum.name,
                        //    id: datum.id,
                        //    address: datum.address
                        //});
                        ////$($("#matchingGiftName").prev()).val($("#matchingGiftName").val());
                        //$("#matchingGiftName").val(datum.name)
                        //$($("#matchingGiftName").prev()).val(datum.name);
                        //$(".tt-menu").hide();
                        //if ($("#matchingGiftID").length > 0) {
                        //    //console.log("element exist")
                        //    $("#matchingGiftID").val(datum.id)
                        //}
                        //else {
                        //    //console.log("Adding hidden input")
                        //    $("#matchingGiftName").after("<input type='hidden' id='matchingGiftID' value='" + datum.id + "'>")
                        //}
                        //clearSearch();

                        //console.log("selected: " + $($("#matchingGiftName").prev()).val())

                    }).on('typeahead:autocomplete', function(e, datum) {
                        //console.log("autocompleted");
                        //$($("#matchingGiftName").prev()).val($("#matchingGiftName").val());
                        //if ($("#matchingGiftID").length > 0) {
                        //    //console.log("element exist")
                        //    $("#matchingGiftID").val(datum.id)
                        //}
                        //else {
                        //    //console.log("Adding hidden input")
                        //    $("#matchingGiftName").after("<input type='hidden' id='matchingGiftID' value='" + datum.id + "'>")
                        //}
                        //clearSearch();
                        //console.log("autocompleted: " + $($("#matchingGiftName").prev()).val())

                    }).on('typeahead:change', function() {
                        //console.log("change: data: ", $("#matchingGiftName").val());
                        //$($("#matchingGiftName").prev()).val($("#matchingGiftName").val());

                        //if ($.trim($(this).typeahead('val')) === '') {
                        //    clearSearch();
                        //}
                        //console.log("changed: " + $($("#matchingGiftName").prev()).val())
                    });
                }).fail(function() {
                    console.log('unable to parse designation query');
                });

                // clear search field
                function clearSearch() {
                    heptypeahead.typeahead('val', '').typeahead('close');
                    heptypeahead.removeData();
                }


            });
        },

        // fund card events
        fundCards: function() {
            // designation category
            $('.des-cat').each(function() {
                $(this).on('click', function() {
                    $(this).toggleClass('expanded');

                    // toggle the aria expanded tag
                    if (this.getAttribute('aria-expanded') === 'true') {
                        this.setAttribute('aria-expanded', 'false');
                    } else {
                        this.setAttribute('aria-expanded', 'true');
                    }

                    // toggle the aria expanded tag and the expanded class for the parent designation block
                    $(this).next().slideToggle(200);
                    if ($(this).hasClass('expanded')) {
                        $(this).closest('.des-block').addClass('expanded');
                        this.closest('.des-block').setAttribute('aria-expanded', 'true');
                    } else {
                        $(this).closest('.des-block').removeClass('expanded');
                        this.closest('.des-block').setAttribute('aria-expanded', 'false');
                    }
                });
            });

            // designation category (keyboard navigation)
            $('.des-cat').each(function() {
                $(this).on('keyup', function(e) {
                    // if the enter key  was pressed, expand the accordian and toggle expanded flags
                    if (e.which == 13) {
                        $(this).toggleClass('expanded');
                        if (this.getAttribute('aria-expanded') === 'true') {
                            this.setAttribute('aria-expanded', 'false');
                        } else {
                            this.setAttribute('aria-expanded', 'true');
                        }
                        $(this).next().slideToggle(200);
                        if ($(this).hasClass('expanded')) {
                            $(this).closest('.des-block').addClass('expanded');
                            this.closest('.des-block').setAttribute('aria-expanded', 'true');
                        } else {
                            $(this).closest('.des-block').removeClass('expanded');
                            this.closest('.des-block').setAttribute('aria-expanded', 'false');
                        }
                    }
                });
            });

            // designation sub-category
            $('.des-subcat').each(function() {
                $(this).on('click', function() {
                    $(this).toggleClass('expanded');
                    if (this.getAttribute('aria-expanded') === 'true') {
                        this.setAttribute('aria-expanded', 'false');
                    } else {
                        this.setAttribute('aria-expanded', 'true');
                    }
                    $(this).next().slideToggle(200);
                });
            });

            // designation sub-category (keyboard navigation)
            $('.des-subcat').each(function() {
                $(this).on('keyup', function(e) {
                    if (e.which == 13) {
                        $(this).toggleClass('expanded');
                        if (this.getAttribute('aria-expanded') === 'true') {
                            this.setAttribute('aria-expanded', 'false');
                        } else {
                            this.setAttribute('aria-expanded', 'true');
                        }
                        $(this).next().slideToggle(200);
                    }
                });
            });

            // Original code to handle clicking of the label. Moved the code to an onclick event on the input tag
            // This allows for better handling while using a screen reader or keyboard navigation

            // designation selection
            //            $('.des-select .checkbox label').on('click', function () {
            //				console.log("Line 850");
            //                // if the check box is checked, add it to the gift form, otherwise remove it
            //				if (!$(this).prev('input').is(':checked')) {
            //                    ADF.Methods.addFund($(this));
            //                } else {
            //                    var id = $(this).prev('input').attr('id');
            //                    ADF.Methods.removeFund(id);
            //                }
            //            });


            // Another section of code that was handling just the keyboard navigation. Found an issue where it
            // would not fire if a screen reader was running. Moved code to an onclick event on the input.

            // designation selection (keyboard navigation)
            // event is fired on the input checkbox, so we need to determine
            // the actual element and id to pass to addFund and removeFund and
            // toggle the "checked" value of the check box
            //            $('.des-select .checkbox').on('keypress', function (e) {
            //                if ((e.which == 32)) {
            //					console.log("Line 865");
            //					// Get the label for the input that was checked. This is needed
            //					// to pass to the addFund function later on
            //                   var choice = $(e.target).labels().first();

            //					// Since we are hidding the standard html checkbox and showing
            //					// pretty css divisions, we need to handle checking and unchecking the
            //					// checkbox. The $(e.target).click(); is not working so we will manually
            //					// set all of the appropriate properties and attributes
            //
            //					// If the box is already checked, uncheck it and set the parent division's
            // aria-checked attribute to false. Then call the removeFund method
            // for the checkbox's ID
            //                    if($(e.target).prop("checked") == true) {
            //						$(e.target).prop(":checked", false);
            //						$(e.target.parentElement).attr("aria-checked", false);
            //						var id = $(e.target).attr('id');
            //						ADF.Methods.removeFund(id);
            //
            //					}

            // Otherwise, set the checkbox to checked, and the aria-checked attribute to true
            // and call the addFund using the checkbox's label element
            //					else {
            //						$(e.target).prop(":checked", true);
            //						$(e.target.parentElement).attr("aria-checked", true);
            //						ADF.Methods.addFund($(choice));
            //					}
            //                }
            //            });


            // fund card event (blur)
            $('#giftSummary').on('blur', '.fund-card input', function() {
                if (!isNaN($(this).val())) {
                    if (Number($(this).val()) < 1.00) {
                        $(this).val('0.00');
                        //$(this).focus();
                        if ($(this).next('.min-amount').length === 0) {
                            $(this).parent().append('<p class="min-amount" role="alert">Please enter a minimum of $1.00.</p>');

                        }

                    } else {
                        if ($(this).next('.min-amount').length !== 0) {
                            $(this).next('.min-amount').remove();
                        }
                        var newVal = parseFloat($(this).val(), 10).toFixed(2);
                        $(this).val(newVal);
                        ADF.Methods.updateTotal();
                    }
                } else {
                    $(this).val('0.00');
                    //$(this).focus();

                }
            });

            // fund card events (change keyup focusout input paste)
            $('#giftSummary').on('change keyup focusout input paste', '.fund-card input', function(e) {
                if (!isNaN($(this).val())) {
                    // update total amount
                    ADF.Methods.updateTotal();

                    // update pledge summary
                    if ($('#pledgeGift').is(':checked')) {
                        ADF.Methods.pledgeSummary();
                    }
                }
            });

            // remove fund
            $('#giftSummary').on('click', '.remove-fund', function(e) {
                e.preventDefault();
                var id = $(this).closest('.fund-card').data('id');
                $('.des-select').find('#' + id).prop('checked', false);
                ADF.Methods.removeFund(id);

                // update pledge summary
                if ($('#pledgeGift').is(':checked')) {
                    ADF.Methods.pledgeSummary();
                }
            });
        },

        // add to cart
        addFund: function(elem) {
            // hide empty card
            if ($('.fund-card.empty').is(':visible')) {
                $('.fund-card.empty').addClass('hidden');
            }

            // fund data
            var value, label, cat, subcat, id;
            if (elem.is('#desSearch')) {
                value = elem.data('value');
                label = elem.data('label');
                cat = elem.data('cat');
                subcat = elem.data('subcat');
                id = elem.data('id');

                // select corresponding checkbox in fund list
                $('.des-select').find('#' + id).prop('checked', true);

            } else if (elem.is('.des-select .checkbox label')) {
                value = elem.prev('input').val();
                label = elem.text();
                cat = elem.prev('input').data('cat');
                subcat = elem.prev('input').data('subcat');
                id = elem.prev('input').attr('id');
            }

            // build fund card markup
            var card = $('\
                <div class="fund-card" id="FC_' + id + '" data-id="' + id + '">\
                    <div class="fund-card-header">\
                        <p><span class="fund-cat">' + cat + '</span> ' + (!!cat ? '/&nbsp;' : '&nbsp;') + '<span class="fund-subcat">' + subcat + '</span></p>\
                    </div>\
                    <div class="fund-card-block">\
                        <div class="row">\
                            <div class="g-4 t-g-2 relative remove-bottom">\
				                 <p id="label-' + id + '"\
				                    class="fund-name">' + label + '</p>\
				                 <p class="fund-guid hidden">' + value + '</p>\
				            </div>\
                            <div class="g-2 t-g-2 relative remove-bottom">\
				                 <p class="symbol">$</p>\
				                 <input aria-labelledby="label-' + id + '"\
				                        id="gift-amt' + id + '"\
				                        class="adfInput form-control required"\
				                        type="number"\
				                        required\
				                        min="1.00"\
				                        max="100000"\
				                        placeholder="Enter an amount"\
				                        step=".01"\
				                        >\
				            </div>\
                        </div>\
                        <div class="row">\
                            <div class="g-12 remove-bottom">' + (label.indexOf('Other') !== -1 ? '<span class="fund-note">* Add fund details in comments box below</span>' : '') + '</div>\
                        </div>\
                    </div>\
                    <div class="fund-card-footer">\
                        <a href="#" class="button remove-fund"><span class="fas fa-times"></span>&nbsp;&nbsp;Remove Gift</a>\
				        <a href="#fundList" class="button" style="z-index:1000"><span class="fas fa-plus"></span>&nbsp;&nbsp;Add Another Fund</a>\
                    </div>\
                </div>\
            ');

            // insert fund card
            card.insertBefore('.proc-fee');
            //console.log("animating to fund card");
            $('html, body').stop().animate({
                scrollTop: $('#giftSummary').offset().top
            }, 300);
            document.getElementById("gift-amt" + id).focus();

            // update total amount
            ADF.Methods.updateTotal();

            // update pledge summary
            if ($('#pledgeGift').is(':checked')) {
                ADF.Methods.pledgeSummary();
            }
        },

        // remove fund
        removeFund: function(id) {
            // remove card
            if (!!id) {
                $('.fund-card[data-id="' + id + '"]').remove();
            }

            // no funds
            if ($('.fund-card').not('.empty, .proc-fee').length === 0) {
                $('.fund-card.empty').removeClass('hidden');
            }

            // update total amount
            ADF.Methods.updateTotal();

            // update pledge summary
            if ($('#pledgeGift').is(':checked')) {
                ADF.Methods.pledgeSummary();
            }
        },

        // update total
        updateTotal: function() {
            // cart variables
            var cartTotal = $('.total-amount span'),
                total = 0,
                newTotal,
                formatter = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                });

            // update processing fee
            if ($('#processingFee').is(':checked')) {
                ADF.Methods.updateProcessingFee();
            } else {
                $('.fund-card.proc-fee input').val('');
            }

            // update total amount
            $('.fund-card input').each(function() {
                var amount = Number($(this).val());
                total += +parseFloat(amount, 10).toFixed(2);
            }).promise().done(function() {
                newTotal = parseFloat(total, 10).toFixed(2);
                cartTotal.text(formatter.format(newTotal));
            });
        },

        // update processing fee
        updateProcessingFee: function() {
            // cache amount variables
            var total = 0;
            var subTotal = function() {
                // calculate cart subtotal
                $('.fund-card').not('.proc-fee').find('input').each(function() {
                    total += +parseFloat($(this).val(), 10).toFixed(2);
                });

                // calculate 3% processing fee
                return parseFloat(total * 0.03, 10).toFixed(2);
            };

            // populate fund card amount
            $('.fund-card.proc-fee input').val(subTotal);

            // display processing fee
            $('#processingFee + label > span').text($('.fund-card.proc-fee input').val());
        },

        // validation markers
        validationMarkers: function() {
            $('<span class="marker"></span>').insertBefore('.required');
            $(".form-control:not(.required)").prev("label").css("line-height", "25px")
        },

        // validate ADF
        validateADF: function() {
            // define validation status
            var isValid = true;

            //Remove required fields from typeahead
            $(".tt-input.required").removeClass("required")
            $(".tt-hint.required").removeClass("required")


            // toggle validation classes on field edit
            $('.required:visible').each(function() {
                if ($.trim($(this).val()) === '' || $(this).val() === '-1' || $(this).is(':invalid')) {
                    isValid = false;
                    $(this).addClass('invalid');
                    $(this).parent().addClass('has-error');
                    $('html, body').stop().animate({
                        scrollTop: $('.invalid:first-of-type').offset().top - 100
                    }, 300);
                    $('#adfError').show();
                }
            });

            // focus on first invalid field
            $('.invalid:visible').first().focus();

            // toggle validation state on field edit
            $('.invalid').on('change keydown', function() {
                $(this).removeClass('invalid').parent().removeClass('has-error');

                if ($('.has-error').length === 0) {
                    // hide error
                    $('#adfError').hide();
                }
            });

            // return validation status
            return isValid;
        },

        // get donation data
        getDonationData: function() {
            // create donation object
            var donation = {
                Donor: {
                    FirstName: $('#personalFirstName').val(),
                    LastName: $('#personalLastName').val(),
                    EmailAddress: $('#personalEmail').val(),
                    Phone: $('#personalPhone').val(),
                    Address: {
                        StreetAddress: $('#personalAddress').val(),
                        City: $('#personalCity').val(),
                        State: $('#personalState').val(),
                        Country: $('#personalCountry option:selected').text(),
                        PostalCode: $('#personalZip').val(),
                    }
                },
                Gift: {
                    Designations: [],
                    Attributes: [],
                    IsCorporate: false,
                    IsAnonymous: false,
                    PaymentMethod: 0
                },
                Origin: {
                    PageId: ADF.Defaults.pageId,
                    PageName: 'ADF'
                },
                BBSPTemplateSitePageId: ADF.Defaults.pageId,
                MerchantAccountId: ADF.Defaults.merchantAccountId,
                PartId: ADF.Defaults.partId
            };

            // assign designations (split gifts)
            $('.fund-card').not('.empty, .proc-fee:hidden').each(function() {
                var gift = {
                    Amount: $(this).find('input').val(),
                    DesignationId: $(this).find('.fund-guid').text()
                };
                donation.Gift.Designations.push(gift);
            });

            // assign donor title and custom attributes
            try {
                // donor title
                if ($('#personalTitle').val() !== '-1') {
                    donation.Donor.Title = $('#personalTitle option:selected').text();
                }

                // Extra fields that get added to comments
                if ($("#twitterAth").length > 0) {
                    if ($("#twitterAth").val() !== '') {
                        $("#comments").val($("#comments").val() + "\nTwitter Handle: " + $("#twitterAth").val());
                    }
                }

                // comments
                if ($('#comments').val() !== '') {
                    var comments = {
                        AttributeId: ADF.Defaults.comments,
                        Value: $('#comments').val()
                    };
                    donation.Gift.Attributes.push(comments);
                }

                // matching gift
                if ($('#matchingGift').is(':checked')) {
                    var matchingGift = {
                        AttributeId: ADF.Defaults.matchingGift,
                        Value: 'True'
                    };
                    donation.Gift.Attributes.push(matchingGift);

                    // matching gift company name
                    if ($('#matchingGiftName').val() !== '' && $('#matchingGiftName').val() != null) {
                        var matchingGiftCompanyName = {
                            AttributeId: ADF.Defaults.matchingGiftCompanyName,
                            Value: $('#matchingGiftName').val()
                        };
                        donation.Gift.Attributes.push(matchingGiftCompanyName);
                    }

                    if ($('#matchingGiftID').val() !== '' && $('#matchingGiftID').val() != null) {
                        var matchingGiftCompanyID = {
                            AttributeId: ADF.Defaults.matchingGiftCompanyID,
                            Value: $('#matchingGiftID').val()
                        };
                        donation.Gift.Attributes.push(matchingGiftCompanyID);
                    }
                }

                // usc fields
                if ($('#usc').is(':checked')) {
                    var usc = {
                        AttributeId: ADF.Defaults.usc,
                        Value: 'True'
                    };
                    donation.Gift.Attributes.push(usc);

                    // usc campus
                    if ($('#uscCampus').val() !== '-1') {
                        var uscCampus = {
                            AttributeId: ADF.Defaults.uscCampus,
                            Value: $('#uscCampus option:selected').text()
                        };
                        donation.Gift.Attributes.push(uscCampus);
                    }

                    // usc college
                    if ($('#uscCollege').val() !== '') {
                        var uscCollege = {
                            AttributeId: ADF.Defaults.uscCollege,
                            Value: $('#uscCollege').val()
                        };
                        donation.Gift.Attributes.push(uscCollege);
                    }

                    // usc department
                    if ($('#uscDept').val() !== '') {
                        var uscDept = {
                            AttributeId: ADF.Defaults.uscDept,
                            Value: $('#uscDept').val()
                        };
                        donation.Gift.Attributes.push(uscDept);
                    }
                }

                // Get the referring URL and URL of the current page.

                var referring = document.referrer;
                if (referring == "" || referring === null) {
                    referring = window.location.origin;
                }

                if (referring != "" && !(referring === null)) {
                    var referringURL = {
                        AttributeId: ADF.Defaults.referringURL,
                        Value: referring
                    };
                    donation.Gift.Attributes.push(referringURL);
                }
                var pageURL = {
                    AttributeId: ADF.Defaults.pageURL,
                    Value: window.location.href
                };
                donation.Gift.Attributes.push(pageURL);

            } catch (err) {
                console.log(err);
            }

            // conditional for anonymous
            if ($('#anonymousGift').is(':checked')) {
                donation.Gift.IsAnonymous = true;
            }

            // conditional for corporate
            if ($('#corporateGift').is(':checked')) {
                donation.Gift.IsCorporate = true;
                donation.Donor.OrganizationName = $('#companyName').val();
            }

            // conditional for tribute
            if ($('#tributeGift').is(':checked') && !$('#ackLetter').is(':checked')) {
                donation.Gift.Tribute = {
                    TributeDefinition: {
                        Type: $('#tributeType input:checked').val(),
                        Description: 'New Tribute',
                        FirstName: $('#tributeFirstName').val(),
                        LastName: $('#tributeLastName').val(),
                        Name: $('#tributeFirstName').val() + " " + $('#tributeLastName').val()
                    }
                };
            }

            // conditional for tribute acknowledgement
            if ($('#tributeGift').is(':checked') && $('#ackLetter').is(':checked')) {
                donation.Gift.Tribute = {
                    TributeDefinition: {
                        Type: $('#tributeType input:checked').val(),
                        Description: 'New Tribute',
                        FirstName: $('#tributeFirstName').val(),
                        LastName: $('#tributeLastName').val(),
                        Name: $('#tributeFirstName').val() + " " + $('#tributeLastName').val()
                    },
                    Acknowledgee: {
                        FirstName: $('#acknowledgeeFirstName').val(),
                        LastName: $('#acknowledgeeLastName').val(),
                        AddressLines: $('#acknowledgeeAddress').val(),
                        City: $('#acknowledgeeCity').val(),
                        State: $('#acknowledgeeState').val(),
                        PostalCode: $('#acknowledgeeZip').val(),
                        Country: $('#acknowledgeeCountry option:selected').text()
                    }
                };
            }

            // conditional for recurring
            if ($('#recurringGift').is(':checked')) {
                // field variables
                var frequency = $('#frequency').val(),
                    startDate = new Date($('#startDate').attr('data-date')),
                    endDate = new Date($('#endDate').val().replace(/-/g, '\/')),
                    dayOfMonth = startDate.getDate(),
                    month = startDate.getMonth() + 1;

                // monthly, quarterly, or annually
                if (frequency === '2') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Frequency: 2,
                        StartDate: startDate,
                        EndDate: !!endDate ? endDate : '',
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                } else if (frequency === '3') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Frequency: 3,
                        StartDate: startDate,
                        EndDate: !!endDate ? endDate : '',
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                } else if (frequency === '4') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Month: month,
                        Frequency: 4,
                        StartDate: startDate,
                        EndDate: !!endDate ? endDate : '',
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                }
            }

            // conditional for pledge installments
            if ($('#pledgeGift').is(':checked')) {
                // field variables
                var frequency = $('#pledgeFrequency').val(),
                    startDate = new Date($('#pledgeStartDate').attr('data-date')),
                    endDate = new Date($('#pledgeEndDate').val().replace(/-/g, '\/')),
                    dayOfMonth = startDate.getDate(),
                    month = startDate.getMonth() + 1;

                // monthly, quarterly, or annually
                if (frequency === '2') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Frequency: 2,
                        StartDate: startDate,
                        EndDate: endDate,
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                } else if (frequency === '3') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Frequency: 3,
                        StartDate: startDate,
                        EndDate: endDate,
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                } else if (frequency === '4') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Month: month,
                        Frequency: 4,
                        StartDate: startDate,
                        EndDate: endDate,
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                }


                // installment variables
                var numberOfInstallments = $('#pledgeInstallments').val(),
                    installmentAmount = $('.installment-amount').text().replace('$', '').replace(',', '');

                donation.Gift.PledgeInstallment = {
                    NumberOfInstallments: numberOfInstallments,
                    InstallmentAmount: installmentAmount
                };
            }

            // conditional for bill me later
            if ($('#billMeLater').is(':checked')) {
                donation.Gift.PaymentMethod = 1;
            }

            // set bbsp return url (credit card)
            if (donation.Gift.PaymentMethod === 0) {
                donation.BBSPReturnUri = window.location.href;
            }

            // if finder number is in URL (core BBIS functionality)
            if (!!ADF.Methods.returnQueryValueByName('efndnum')) {
                donation.Gift.FinderNumber = ADF.Methods.returnQueryValueByName('efndnum');
            }

            // if source code is in URL (core BBIS functionality)
            if (!!ADF.Methods.returnQueryValueByName('source')) {
                donation.Gift.SourceCode = ADF.Methods.returnQueryValueByName('source');
            }

            // if appeal id exists
            if ($('#appeal').length !== 0 && !$('#appeal').is(':empty')) {
                donation.Origin.AppealId = $('#appeal').text();
            }

            // return donation object
            return donation;
        },

        // check equality of server date and (recurring or pledge installment gift) start date
        isProcessNow: function() {
            var frequency,
                startDate;

            if ($('#recurringGift').is(':checked')) {
                frequency = $('#frequency').val();
                startDate = new Date($('#startDate').attr('data-date'));
            } else if ($('#pledgeGift').is(':checked')) {
                frequency = $('#pledgeFrequency').val();
                startDate = new Date($('#pledgeStartDate').attr('data-date'));
            }

            var dayOfMonth = startDate.getDate(),
                month = startDate.getMonth() + 1,
                serverDate = ADF.Defaults.serverDate,
                recurrenceStartDate = startDate,
                startDateIsTodayDate = false,
                isProcessedNow = false;

            if (recurrenceStartDate.getFullYear() === serverDate.getFullYear() && recurrenceStartDate.getMonth() === serverDate.getMonth() && recurrenceStartDate.getDate() === serverDate.getDate()) {
                startDateIsTodayDate = true;
            } else {
                return false;
            }

            if (frequency === '2' || frequency === '3') {
                isProcessedNow = startDateIsTodayDate && dayOfMonth === serverDate.getDate();
            } else if (frequency === '4') {
                isProcessedNow = startDateIsTodayDate && dayOfMonth === serverDate.getDate() && month === serverDate.getMonth() + 1;
            } else {
                isProcessedNow = false;
            }

            return isProcessedNow;
        },

        // api error handling
        convertErrorToString: function(error) {
            if (error) {
                if (error.Message)
                    return error.Message;
                switch (error.ErrorCode) {
                    case 101:
                        if (true) {
                            return error.Field + ' is required.';
                        }
                        break;
                    case 102:
                        if (true) {
                            return error.Field + ' is invalid.';
                        }
                        break;
                    case 103:
                        if (true) {
                            return error.Field + ' is below minimum.';
                        }
                        break;
                    case 104:
                        if (true) {
                            return error.Field + ' exceeds maximum.';
                        }
                        break;
                    case 105:
                        if (true) {
                            return error.Field + ' is not allowed.';
                        }
                        break;
                    case 106:
                        if (true) {
                            return 'Record for ' + error.Field + ' was not found.';
                        }
                        break;
                    case 107:
                        if (true) {
                            return 'Max length for ' + error.Field + ' exceeded.';
                        }
                        break;
                    case 203:
                        if (true) {
                            return 'Your donation was not completed and your credit card has not been charged. Please try again later.';
                        }
                        break;
                    default:
                        return 'Error code ' + error.ErrorCode + '.';
                }
            }
        },

        // convert errors to html
        convertErrorsToHtml: function(errors) {
            // process error
            var i, message = 'Unknown error.<br/>';
            if (errors) {
                message = '';
                for (i = 0; i < errors.length; i++) {
                    message = message + ADF.Methods.convertErrorToString(errors[i]) + '<br/>';
                }
            }
            return message;
        },

        // gift options
        giftOptions: function() {
            // field variables
            var recurringGift = $('#recurringGift'),
                recurringGiftSection = $('#recurringGiftSection'),
                endingDate = $('#endingDate'),
                pledgeGift = $('#pledgeGift'),
                pledgeGiftSection = $('#pledgeGiftSection'),
                tributeGift = $('#tributeGift'),
                honoreeSection = $('#honoreeSection'),
                acknowledgeeLetter = $('#ackLetter'),
                acknowledgeeSection = $('#acknowledgeeSection'),
                matchingGift = $('#matchingGift'),
                matchingGiftSection = $('#matchingGiftSection'),
                usc = $('#usc'),
                uscSection = $('#uscSection'),
                corpGift = $('#corporateGift'),
                corpGiftSection = $('#corporateGiftSection');

            // recurring gift selection
            recurringGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show recurring gift fields
                    recurringGiftSection.removeClass('hidden');

                    // hide pledge gift checkbox
                    pledgeGift.parent().addClass('hidden');

                    // uncheck pledge gift checkbox if checked
                    if (pledgeGift.is(':checked')) {
                        pledgeGift.click();
                    }

                    // hide tribute checkbox
                    tributeGift.parent().addClass('hidden');

                    // uncheck tribute checkbox if checked
                    if (tributeGift.is(':checked')) {
                        tributeGift.click();
                    }

                    // uncheck acknowledgee checkbox if checked
                    if (acknowledgeeLetter.is(':checked')) {
                        acknowledgeeLetter.click();
                    }
                } else {
                    // hide recurring gift fields
                    recurringGiftSection.addClass('hidden');

                    // show pledge gift checkbox
                    pledgeGift.parent().removeClass('hidden');

                    // show tribute checkbox
                    tributeGift.parent().removeClass('hidden');
                }

                // toggle ending date section
                if (endingDate.is(':checked') && !$(this).is(':checked')) {
                    endingDate.click();
                }
            });

            // optional end date selection
            endingDate.on('change', function() {
                if ($(this).is(':checked')) {
                    $(this).closest('.row').next('.row').removeClass('hidden');
                } else {
                    $(this).closest('.row').next('.row').addClass('hidden');
                }
            });

            // pledge gift selection
            pledgeGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show pledge gift fields
                    pledgeGiftSection.removeClass('hidden');

                    // hide recurring checkbox
                    recurringGift.parent().addClass('hidden');

                    // uncheck recurring checkbox if checked
                    if (recurringGift.is(':checked')) {
                        recurringGift.click();
                    }

                    // uncheck acknowledgee checkbox if checked
                    if (acknowledgeeLetter.is(':checked')) {
                        acknowledgeeLetter.click();
                    }

                    // hide tribute checkbox
                    tributeGift.parent().addClass('hidden');

                    // uncheck tribute checkbox if checked
                    if (tributeGift.is(':checked')) {
                        tributeGift.click();
                    }
                } else {
                    // hide pledge gift fields
                    pledgeGiftSection.addClass('hidden');

                    // show recurring checkbox
                    recurringGift.parent().removeClass('hidden');

                    // show tribute checkbox
                    tributeGift.parent().removeClass('hidden');
                }
            });

            // tribute selection
            tributeGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show honoree section
                    honoreeSection.removeClass('hidden');

                    // hide recurring gift section
                    recurringGiftSection.addClass('hidden');
                    recurringGift.parent().addClass('hidden');

                    // hide pledge gift section
                    pledgeGiftSection.addClass('hidden');
                    pledgeGift.parent().addClass('hidden');
                } else {
                    // hide honoree and acknowledgee sections
                    honoreeSection.addClass('hidden');
                    acknowledgeeSection.addClass('hidden');

                    // show recurring gift checkbox
                    recurringGift.parent().removeClass('hidden');

                    // show pledge gift checkbox
                    pledgeGift.parent().removeClass('hidden');
                }

                // toggle acknowledgee section
                if (acknowledgeeLetter.is(':checked') && !$(this).is(':checked')) {
                    acknowledgeeLetter.click();
                }
            });

            // acknowledgee selection
            acknowledgeeLetter.on('change', function() {
                if ($(this).is(':checked')) {
                    // show acknowledgee section
                    acknowledgeeSection.removeClass('hidden');
                } else {
                    // hide acknowledgee section
                    acknowledgeeSection.addClass('hidden');
                }
            });

            // matching gift selection
            matchingGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show matching gift section
                    matchingGiftSection.removeClass('hidden');

                    // hide corporate gift checkbox
                    corpGift.parent().addClass('hidden');
                } else {
                    // hide matching gift section
                    matchingGiftSection.addClass('hidden');

                    // show corporate gift checkbox
                    corpGift.parent().removeClass('hidden');
                }
            });

            // usc selection
            usc.on('change', function() {
                if ($(this).is(':checked')) {
                    // show usc section
                    uscSection.removeClass('hidden');
                } else {
                    // hide usc section
                    uscSection.addClass('hidden');
                }
            });

            // corporate gift selection
            corpGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show company name section
                    corpGiftSection.removeClass('hidden');

                    // hide matching gift checkbox
                    matchingGift.parent().addClass('hidden');

                    // uncheck matching gift checkbox if checked
                    if (matchingGift.is(':checked')) {
                        matchingGift.click();
                    }
                } else {
                    // hide company name section
                    corpGiftSection.addClass('hidden');

                    // show matching gift checkbox
                    matchingGift.parent().removeClass('hidden');
                }
            });
        },

        // processing fee
        procFee: function() {
            // fund card
            var pf = $('.fund-card.proc-fee');

            // toggle transaction fee
            $('#processingFee').on('click', function() {
                // toggle visibility
                pf.toggleClass('hidden');

                // update total amount
                ADF.Methods.updateTotal();

                // update pledge summary
                if ($('#pledgeGift').is(':checked')) {
                    ADF.Methods.pledgeSummary();
                }
            });

            // remove transaction fee
            pf.find('.remove-fee').on('click', function(e) {
                e.preventDefault();
                $('#processingFee').click();
            });
        },

        // get countries and states
        getCountryState: function() {
            var selectDonorCountry = $('#personalCountry'),
                selectDonorState = $('#personalState'),
                selectAckCountry = $('#acknowledgeeCountry'),
                selectAckState = $('#acknowledgeeState');

            // load countries
            $.get(ADF.Defaults.rootPath + 'webapi/country', function(countries) {
                for (var i = 0, j = countries.length; i < j; i++) {
                    selectDonorCountry.append('<option value="' + countries[i].Id + '">' + countries[i].Description + '</option>');
                    selectAckCountry.append('<option value="' + countries[i].Id + '">' + countries[i].Description + '</option>');
                }
            }).done(function() {
                // default country (United States)
                selectDonorCountry.val(ADF.Defaults.defaultCountry).change();
                selectAckCountry.val(ADF.Defaults.defaultCountry).change();
            });

            // watch country change (donor)
            selectDonorCountry.on('change', function() {
                // load states
                $.get(ADF.Defaults.rootPath + 'webapi/country/' + $(this).val() + '/state', function(states) {
                    selectDonorState.html('');
                    for (var i = 0, j = states.length; i < j; i++) {
                        selectDonorState.append('<option value="' + states[i].Abbreviation + '">' + states[i].Description + '</option>');
                    }
                    selectDonorState.prepend('<option value="-1">State/Territory</option>').val('-1');
                }).done(function() {
                    if (selectDonorState.find('option').length < 2) {
                        selectDonorState.removeAttr('required').removeClass('required');
                        selectDonorState.siblings('.marker').hide();
                    } else {
                        selectDonorState.prop('required', true).addClass('required');
                        selectDonorState.siblings('.marker').show();
                    }
                });
            });

            // watch country change (acknowledgee)
            selectAckCountry.on('change', function() {
                // load states
                $.get(ADF.Defaults.rootPath + 'webapi/country/' + $(this).val() + '/state', function(states) {
                    selectAckState.html('');
                    for (var i = 0, j = states.length; i < j; i++) {
                        selectAckState.append('<option value="' + states[i].Abbreviation + '">' + states[i].Description + '</option>');
                    }
                    selectAckState.prepend('<option value="-1">State/Territory</option>').val('-1');
                }).done(function() {
                    if (selectAckState.find('option').length < 2) {
                        selectAckState.removeAttr('required').removeClass('required');
                        selectAckState.siblings('.marker').hide();
                    } else {
                        selectAckState.prop('required', true).addClass('required');
                        selectAckState.siblings('.marker').show();
                    }
                });
            });
        },

        // get title table
        getTitle: function() {
            var donorTitle = $('#personalTitle');

            $.get(ADF.Defaults.rootPath + 'webapi/CodeTable/' + ADF.Defaults.titleTable, function(data) {
                for (var i = 0, j = data.length; i < j; i++) {
                    donorTitle.append('<option value="' + data[i].Id + '">' + data[i].Description + '</option>');
                }
            }).done(function() {
                donorTitle.val('-1').change();
            });
        },

        // date picker behavior
        datePicker: function() {
            // today's date
            var date = new Date(),
                today = date.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }).replace(/\u200E/g, '');

            if ($('html').hasClass('-ms-')) {
                $('#startDate').val(today);
                $('#pledgeStartDate').val(today);
            } else {
                $('#startDate').val(new Date(today).toISOString().substring(0, 10));
                $('#pledgeStartDate').val(new Date(today).toISOString().substring(0, 10));
            }

            // normalized date attribute
            $('#startDate').attr('data-date', today);
            $('#pledgeStartDate').attr('data-date', today);
        },

        // calculate installments
        calculateInstallments: function() {
            // run on all field events
            $('#pledgeInstallments').add('#pledgeFrequency').on('change keyup focusout input paste', function() {
                ADF.Methods.pledgeSummary();
            });
        },

        // pledge summary
        pledgeSummary: function() {
            // pledge installment helper function variables
            var totalGiftAmount = $('.total-amount span').text().replace('$', '').replace(',', ''),
                numberOfInstallments = $('#pledgeInstallments').val(),
                frequencyCode = $('#pledgeFrequency').val(),
                installmentStartDate = new Date($('#pledgeStartDate').attr('data-date')),
                installmentDayOfMonth = installmentStartDate.getDate(),
                installmentMonth = installmentStartDate.getMonth() + 1;

            // pledge summary logic
            if ($('.fund-card.empty').hasClass('hidden') && $('#pledgeFrequency').val() !== '-1' && $('#pledgeInstallments').val() !== '' && $('.min-amount').length === 0) {
                // payment info variables
                var GiftLastPaymentDate = donationService.getRecurringGiftLastPaymentDate(numberOfInstallments, frequencyCode, installmentStartDate, installmentMonth, installmentDayOfMonth).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                    }),
                    GiftInstallmentAmount = donationService.getRecurringGiftInstallmentAmount(totalGiftAmount, numberOfInstallments);

                // convert currency format
                var formatter = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    }),
                    formattedInstallmentAmount = formatter.format(GiftInstallmentAmount);

                // pledge summary content variable
                var pledgeSummary = numberOfInstallments + ' installments of <span class="installment-amount">' + formattedInstallmentAmount + '</span> ' + $('#pledgeFrequency option:selected').text().toLowerCase() + 'until ' + GiftLastPaymentDate;

                // set pledge installment end date
                if ($('html').hasClass('-ms-')) {
                    $('#pledgeEndDate').val(GiftLastPaymentDate);
                } else {
                    $('#pledgeEndDate').val(new Date(GiftLastPaymentDate).toISOString().substring(0, 10));
                }

                // show pledge summary
                $('#pledgeSummary').show().find('p').html(pledgeSummary);
            } else {
                // reset pledge installment end date
                $('#pledgeEndDate').val('');

                // hide pledge summary
                $('#pledgeSummary').hide();
            }
        }
    }
};

// create new instance of donation service (global)
var donationService = new BLACKBAUD.api.DonationService(ADF.Defaults.partId);

// run scripts
ADF.Methods.pageInit();

// character counter
(function($) {
    $.fn.extend({
        limit: function(element) {
            var self = $(this),
                limit = self.attr('maxlength');
            self.keyup(function() {
                var length = self.val().length;
                var count = limit - length;
                $(element).text(count);
            });
        }
    });
})(jQuery);

// invalid expression matcher (form validation)
jQuery.extend(jQuery.expr[':'], {
    invalid: function(elem, index, match) {
        var invalids = document.querySelectorAll(':invalid'),
            result = false,
            len = invalids.length;

        if (len) {
            for (var i = 0; i < len; i++) {
                if (elem === invalids[i]) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }
});

// add focus styling to the parent (li) element of the radio button receiving focus
function parentFocus(event) {
    // get event object if using internet explorer
    var e = event || window.event;

    // check the object for w3c dom event object, if not use ie event object to update the class of the parent element
    if (e.target) {
        e.target.parentNode.classList.add('focus');
    } else {
        e.srcElement.parentNode.classList.add('focus');
    }
}

// remove focus styling from the parent (li) element of the radio button receiving focus
function parentBlur(event) {
    // get event object if using internet explorer
    var e = event || window.event,
        node;

    // check the object for w3c dom event object, if not use ie event object to update the class of the parent element
    if (e.target) {
        e.target.parentNode.classList.remove('focus');
    } else {
        e.srcElement.parentNode.classList.remove('focus');
    }
}

function toTitleCase(str) {
    var lcStr = str.toLowerCase();
    return lcStr.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
}

function checkboxPressed(event) {
    // This function is fired by the onclick function of the fund checkboxes
    // Onclick will handle standard keyboard input (spacebar) and mouse click
    // as well as function while a screen reader is present.

    // Get the event that was fired
    var e = event || window.event,
        node;


    // Get the label for the input that was checked. This is needed
    // to pass to the addFund function later on
    var choice = $(e.target).labels().first();

    // Since we are hidding the standard html checkbox and showing
    // pretty css divisions, we need to handle checking and unchecking the
    // checkbox. The $(e.target).click(); is not working so we will manually
    // set all of the appropriate properties and attributes

    // If the box is already checked, uncheck it and set the parent division's
    // aria-checked attribute to false. Then call the removeFund method
    // for the checkbox's ID
    if ($(e.target).prop("checked") == false) {
        $(e.target).prop(":checked", false);
        $(e.target.parentElement).attr("aria-checked", false);
        var id = $(e.target).attr('id');
        ADF.Methods.removeFund(id);

    }

    // Otherwise, set the checkbox to checked, and the aria-checked attribute to true
    // and call the addFund using the checkbox's label element
    else {
        $(e.target).prop(":checked", true);
        $(e.target.parentElement).attr("aria-checked", true);
        ADF.Methods.addFund($(choice));
    }

}