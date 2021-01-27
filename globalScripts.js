/* Blackbaud ISD Custom Javascript
====================================================================
Client: University of South Carolina
Author(s): Mark Hillard
Product(s): BBIS
Created: 07/16/2019
Updated: 04/13/2020


CHANGELOG
====================================================================
07/16/2019: Initial build
07/16/2019: Added mobile navigation functionality
11/06/2019: Added social sharing buttons
01/27/2020: Added function for accessibility fixes (USC)
04/13/2020: Added function for accessibility fixes (USC)
05/18/2020: Added html to New User Reg and Giving History
08/24/2020: Adjusting css fixes


INSTRUCTIONS
====================================================================
1. Include this file at the layout level on the very last line.
2. Namespaced functions should be placed in pageInit(), pageRefresh() or pageLoad(), respectively.
3. Every custom function should have its code wrapped in a conditional, checking for the existence (.length !== 0) of the specific part being altered.
*/


var BBI = BBI || {
    // update these values when updating changelog
    Config: {
        version: 1.3,
        updated: '01/27/2020',
        isEditView: !!window.location.href.match('pagedesign'),
        responsive: true
    },
    
    Defaults: {
        rootpath: BLACKBAUD.api.pageInformation.rootPath,
        pageId: BLACKBAUD.api.pageInformation.pageId
    },
    
    Methods: {
        pageInit: function () {
            // all functions that run instantly
            BBI.Methods.addHelperClasses();
            
            // runs on partial page refresh
            Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(function () {
                BBI.Methods.pageRefresh();
            });
            
            // runs on full page load
            $(document).ready(function () {
                BBI.Methods.pageLoad();
            });
            
            // runs after all page assets are loaded
            $(window).on('load', function () {
                BBI.Methods.windowLoad();
            });
			
        },
        
        // runs on partial page refresh
        pageRefresh: function () {
            BBI.Methods.addHelperClasses();
            BBI.Methods.responsiveEventRegistrationClassic();
            BBI.Methods.hideValidationSummary();
            BBI.Methods.hideDateRanges();
            BBI.Methods.miniDonationForm();
            BBI.Methods.acquisitionForm();
			BBI.Methods.socialSharing();
			BBI.Methods.forgotPassword();
        },
        
        // runs on full page load
        pageLoad: function () {
            BBI.Methods.hideValidationSummary();
            BBI.Methods.mobileNav();
            BBI.Methods.socialSharing();
            BBI.Methods.forgotPassword();
            BBI.Methods.addAriaRoles();
            if ($('#adfConfWrapper').length > 0) {
                BBI.Methods.addWatcherToConfirmation();
            }
        },
        
        // runs after all page assets are loaded
        windowLoad: function () {
            // nothing to see here...
        },
        
        addHelperClasses: function () {
            BBI.Methods.addClassToRequiredInputs();
            BBI.Methods.addClassToTextareaLabel();
            BBI.Methods.addClassToPaymentPart();
			BBI.Methods.socialSharing();
            if (BBI.Config.responsive && !BBI.Config.isEditView) {
                BBI.Methods.addResponsiveClasses();
            }
        },
        
        // responsive functions
        addResponsiveClasses: function () {
            BBI.Methods.responsiveDonationForm();
            BBI.Methods.responsiveEventRegistrationNew();
            BBI.Methods.responsivePaymentPart();
            BBI.Methods.responsiveSurvey();
            BBI.Methods.responsiveUserEmailPreferences();
            BBI.Methods.responsiveUserLogin();
            BBI.Methods.cleanEventCalendar();
            
            // check screen width on load/resize event
            $(window).on('load resize', function () {
                if ($(window).width() <= 800) {
                    BBI.Methods.responsiveEventCalendar();
                }
            });
        },
        
        // gets variables and values from URL
        getUrlVars: function () {
            var vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = decodeURIComponent(value.replace(/\+/g, ' '));
            });
            return vars;
        },
        
        // fix positioning of part context menu
        fixPositioning: function () {
            $('div[id*="_panelPopup"]').appendTo('body');
            $('div[id*="_designPaneCloak"]').css({
                'top': '0',
                'left': '0'
            });
            $('.DesignPane').css('position', 'relative');
        },
        
        // remove whitespace nodes
        cleanWhiteSpace: function (elem) {
            $(elem).contents().filter(function () {
                return (this.nodeType == 3 && !/\S/.test(this.nodeValue));
            }).remove();
            return this;
        },
        
        // create cookie - pass in name, value and expiration date of cookie
        // note: setting "days" argument to "0" creates a session cookie
        createCookie: function (name, value, days) {
            var expires = '';
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }
            document.cookie = name + '=' + value + expires + '; path=/';
        },
        
        // read cookie - pass in name of cookie
        readCookie: function (name) {
            var nameEQ = name + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },
        
        // delete cookie - pass in name of cookie
        deleteCookie: function (name) {
            BBI.Methods.createCookie(name, '', -1);
        },
        
        // hide empty validation summary
        hideValidationSummary: function () {
            var emptyValidSum = $('.BBFormValidatorSummary:empty');
            if (emptyValidSum) {
                $(emptyValidSum).hide();
            }
        },
        
        // mobile navigation
        mobileNav: function () {
            // fix non-scrolling overflow issue on mobile devices
            $('#mobile-nav > ul').wrap('<div class="overflow"></div>');
            $(window).on('load resize', function () {
                if ($(window).width() <= 800) {
                    var vph = $(window).height() - 59;
                    $('.overflow').css('max-height', vph);
                }
            });
            
            // global variables
            var menu = $('#mobile-nav');
            var bg = $('html, body');
            
            // toggle background scrolling
            function bgScrolling() {
                // if menu has toggled class... *
                if (menu.hasClass('open')) {
                    // * disable background scrolling
                    bg.css({
                        'overflow-y': 'hidden',
                        'height': 'auto'
                    });
                // if menu does not have toggled class... *
                } else {
                    // * enable background scrolling
                    bg.css({
                        'overflow-y': 'visible',
                        'height': '100%'
                    });
                }
            }
            
            // menu button click event
            $('#mobile-nav-button > a').on('click', function (e) {
                // prevent default action
                e.preventDefault();
                
                // activate toggles
                if ($(this).find('svg').attr('data-icon') === 'bars') {
                    $(this).find('svg').attr('data-icon', 'times');
                } else {
                    $(this).find('svg').attr('data-icon', 'bars');
                }
                menu.show().removeClass('load').toggleClass('open');
                bgScrolling();
            });
        },
        
		// This function adds a watcher to the ADF confirmation wrapper. If it flips from
		// hidden to shown, it reruns the page load function.
		addWatcherToConfirmation: function () {
			var observer = new MutationObserver(
								function(mutations) {
    								BBI.Methods.pageLoad();
  								}
							);
            var target = $('#adfConfWrapper')[0];
            if ($('#adfConfWrapper').length > 0) {
                observer.observe(target, {
                    attributes: true
                });
            }
		},


        // dynamic social sharing buttons
        socialSharing: function () {
            // share links
			var facebookLink = 'http://www.facebook.com/sharer.php?u=' + location.href,
                twitterLink = 'http://twitter.com/share?url=' + location.href;
                
            // facebook sharing button
            $('.social-sharing .share a').each(function () {
                $(this).attr('href', facebookLink);
                $(this).click(function () {
                    window.open($(this).attr('href'), 'title', 'width=600,height=400');
                    return false;
                });
            });

            // twitter sharing button
            $('.social-sharing .tweet a').each(function () {
                $(this).attr('href', twitterLink);
                $(this).click(function () {
                    window.open($(this).attr('href'), 'title', 'width=600,height=400');
                    return false;
                });
            });
        },
        
        // forgot password success message
        forgotPassword: function () {
            if ($('tr[id$="trForgotPasswordMessage"]').length !== 0) {
                $('span[id$="lblForgotPasswordMessageTitle"]').html('Password reset instructions have been sent');
                $('span[id$="lblForgotPasswordMessage"]').html('We have sent an email to the address you provided. If this address is associated with an existing account, the email will provide instructions for resetting your password. If you do not see the email in your inbox, please check your junk email folder. If you continue to have difficulty logging in, please contact us at <a href="mailto:devcid@mailbox.sc.edu">devcid@mailbox.sc.edu</a>.');
            }
        },

        // accessibility fixes
        addAriaRoles: function () {
            $("#masthead").attr("role", "banner");
            $("#mobile-nav").attr("role", "navigation");
            $("#mobile-nav").attr("aria-label", "Mobile navigation.");
            
            $("#content-side > div:nth-child(1) > div > ul").attr("role", "navigation");
            $("#content-side > div:nth-child(1) > div > ul").attr("aria-label", "Desktop navigation.");
            
            $("#page-header").attr("role", "navigation");
            $("#page-header").attr("aria-label", "Bread crumbs.");
            
            $("#content-main").attr("role", "main");
			$("#footer-top").attr("role", "contentinfo");
			$("#footer-top").attr("aria-label", "Page footer top.");
            $("#footer-bottom").attr("role", "contentinfo");
			$("#footer-bottom").attr("aria-label", "Page footer bottom.");
			
			$("#otherwaystogive_callout").attr("role", "complementary");
			$("#otherwaystogive_callout").attr("aria-label", "Other ways to give.");
			
			$(".social-sharing").attr("role", "complementary");
			$(".social-sharing").attr("aria-label", "Social Media Links.");
			
			$("#wecanhelp_callout").attr("role", "complementary");
			$("#wecanhelp_callout").attr("aria-label", "We can help.");
			            
            $('body').prepend("<a id='skiptocontent' href='#content-main' class=''><span>Skip to Content</span></a>");
			
			//Fixes April 2020
			$("#PC1013_lnkTarget").css("display","none");
			
			$("#PC1013_tbl").attr("role", "presentation");
			$("#PC1013_trRegistrationRequest").attr("role", "presentation");

			
			$("#PC1013_lblLoginTitle").css("display", "none");
			$("#PC1013_lblRegRequestTitle").css("display", "none");
			
			$("#PC1005_button_1").attr("aria-label", "View and choose preferred email communication preferences.");
			$("#PC1006_button_2").attr("aria-label", "View your past and active gifts to the University of South Carolina.");
			$("#PC1007_button_3").attr("aria-label", "View and update any biographical or contact information that will be stored to your profile.");
			
			//Fixes May 2020	
			$("#PC1013_AddressCtl_ctl_zipUS").attr("class", "BBFieldControlCell");
			$("#PC1013_AddressCtl_ctl_cityUS").attr("class", "BBFieldControlCell");
			
            // Fix the RPXNow Social Media Sign on ADA issues and styling. Set tabindex for every button to 0. Only run on the login page
            if ($(location).attr("href") == "https://donate.sc.edu/sign-in") {
                var checkExist = setInterval(function () {
                    if ($("#janrainProviderPages > div > ul > li > a").first().attr("tabindex") == 1 && $(location).attr("href") == "https://donate.sc.edu/sign-in") {
                        $("#janrainProviderPages > div > ul > li > a").attr("tabindex", "0");
                        $("#janrainProviderPages > div > ul > li > a").css("text-align", "left");
                        $("#janrainProviderPages > div > ul > li > a").css("padding-left", "100px");
                        clearInterval(checkExist);
                    }
                }, 100);
            }
			
        },
        
        // adds "required" class to inputs that are required fields
        addClassToRequiredInputs: function () {
            // check if we're on a page with a form first
            if (($('.BBFormTable').length !== 0) || ($('.PaymentPart_FormContainer').length !== 0) || ($('div[id$="ev2wiz"]').length !== 0) || ($('div[id$="formWizard"]').length !== 0)) {
                // select all required table cell elements, go to their parent(s), find the label/span, and add class
                var requiredFieldMarkers = $('.BBFormTable .BBFormRequiredFieldMarker, .PaymentPart_FormContainer .BBFormRequiredFieldMarker, .Ev2_RegistrationStepContainer .BBFormRequiredFieldMarker, div[id$="formWizard"] .BBFormRequiredFieldMarker');
                $.each(requiredFieldMarkers, function () {
                    if ($(this).css('visibility') !== 'hidden') {
                        $(this).addClass('hiddenRequiredField');
                        $(this).closest('tr').find('label, span').not('[class*="Checkbox"], [id*="lblSymbol"], [for*="_chkAcknowledge"], .CalendarFormFieldCaption').addClass('required');
                    }
                });
                
                // explict elements
                $('label[id$="_lblAmountCaption"]').addClass('required'); // amount field (donation form)
                $('.Ev2_RegistrantFieldCell .BBFormRequiredFieldMarker').each(function () {
                    $(this).parent().find('label').addClass('required'); // each registrant field (event registration 2.0)
                });
                $('.PaymentPart_PersonalInfoContainer .BBFormRequiredFieldMarker').each(function () {
                    $(this).siblings('label, span').addClass('required'); // each registrant field (payment 2.0)
                });
                $('div[id$="formWizard"] .BBFormRequiredFieldMarker').each(function () {
                    if (!$(this)[0].hasAttribute('style')) {
                        $(this).parent().find('label').addClass('required'); // each info field (common form)
                    }
                });
                
                // fix required markers for tribute fields (donation form)
                var ddTribute = $('select[id$="ddlTribute"]');
                var labelTribute = $('label[id$="lblTributeLastName"], label[id$="lblName"], label[id$="lblDescription"]');
                if (ddTribute.length !== 0) {
                    $(ddTribute).on('change', function () {
                        if ($(this).val() === '0') {
                            $(labelTribute).removeClass('required');
                        } else {
                            $(labelTribute).addClass('required');
                        }
                    });
                }
            }
        },
        
        // add class to label for textarea inputs on div-based forms
        addClassToTextareaLabel: function () {
            if ($('.BBDivFieldContainer textarea').prev('label').not('.labelForTextarea').length !== 0) {
                $('.BBDivFieldContainer textarea').prev('label').addClass('labelForTextarea');
            }
        },
        
        // add classes to specific elements on payment part
        addClassToPaymentPart: function () {
            if ($('.PaymentPartGrid').length !== 0) {
                $('.PaymentPartGrid').parent().parent().closest('table').addClass('paymentPart');
                $('.PaymentPartClearLink').addClass('button');
            }
        },
        
        // bind handler to change event of checkboxes to call separate function to apply/remove classes to/from label when clicked
        responsiveCheckboxesChangeEvent: function () {
            $('input[type="checkbox"]').change(BBI.Methods.responsiveCheckboxesAddClass).next('label').addClass('checkboxLabel');
        },
        
        // dynamic classes added/removed from checkbox labels for mobile treatment
        responsiveCheckboxesAddClass: function () {
            $('input[type="checkbox"]').each(function () {
                if ($(this).is(':checked')) {
                    $(this).next('label').addClass('boxChecked');
                } else {
                    $(this).next('label').removeClass('boxChecked');
                }
            });
        },
        
        // bind handler to change event of giving amount radio buttons to call separate function to apply/remove classes to/from labels when clicked/tapped
        responsiveGivingAmountsChangeEvent: function () {
            $('table[id$="tblAmount"] input[name$="givingLevels"]').change(BBI.Methods.responsiveGivingAmountsAddClass);
        },
        
        // give class to the giving amount for the radio button that's currently selected
        responsiveGivingAmountsAddClass: function () {
            $('table[id$="tblAmount"] input[name$="givingLevels"]').each(function () {
                if ($(this).is(':checked')) {
                    if ($(this).val() === 'rdoOther') {
                        $(this).siblings('label').eq(0).addClass('boxChecked');
                    } else {
                        $(this).closest('td').next('td').children('.radioLabel').addClass('boxChecked');
                    }
                } else {
                    if ($(this).val() === 'rdoOther') {
                        $(this).siblings('label').eq(0).removeClass('boxChecked');
                    } else {
                        $(this).closest('td').next('td').children('.radioLabel').removeClass('boxChecked');
                    }
                }
            });
        },
        
        // bind handler to change event of radio buttons (except giving amounts) to call separate function to apply/remove classes to/from labels when clicked/tapped
        responsiveRadioButtonChangeEvent: function () {
            if ($('input[type="radio"]').length !== 0) {
                $('input[type="radio"]').filter(function () {
                    return -1 === this.name.indexOf('givingLevels');
                }).change(BBI.Methods.responsiveRadioButtonAddClass).next('label').addClass('radioLabel');
            }
        },

        
        // add class to radio button label if its button has been clicked
        responsiveRadioButtonAddClass: function () {
            $('input[type="radio"]').filter(function () {
                return -1 === this.name.indexOf('givingLevels');
            }).each(function () {
                if ($(this).is(':checked')) {
                    $(this).next('label').addClass('boxChecked');
                } else {
                    $(this).next('label').removeClass('boxChecked');
                }
            });
        },
        
        // Donation Form classes and responsive behavior
        responsiveDonationForm: function () {
            if ($('.DonationFormTable').length !== 0) {
                // classes that help with targeted styling
                $('label[id$="lblTxtOnMonthlyQuarterly"]').parent().addClass('labelRecurrenceStartingOn');
                $('input[id$="Recurrence_rdoDay"]').parent().parent().addClass('radioRecurrenceDay');
                $('select[id$="Recurrence_ddlDayNumber2"]').parent().addClass('inputDayOfMonth');
                $('tr[id$="tr_AdvancedRecurringOptions"] > td:nth-child(1)').addClass('emptyTDBelowOnLabel');
                $('tr[id$="tr_AdvancedRecurringOptions"] > td:nth-child(2)').addClass('radioRecurrenceDayFrequency');
                $('tr[id$="tr_AdvancedRecurringOptions"] > td:nth-child(3)').addClass('inputRecurrenceDayFrequency');
                $('tr[id$="Recurrence_trAnnually"] > td').eq(0).addClass('annualRecurrenceTD');
                // swap text in weekly and monthly drop-downs
                $('select[id$="Recurrence_ddlPosition"]').each(function () {
                    $(this).children('option').eq(0).html('1st');
                    $(this).children('option').eq(1).html('2nd');
                    $(this).children('option').eq(2).html('3rd');
                    $(this).children('option').eq(3).html('4th');
                });
                $('select[id$="Recurrence_ddlDayOfWeek2"]').each(function () {
                    $(this).children('option').eq(0).html('Sun');
                    $(this).children('option').eq(1).html('Mon');
                    $(this).children('option').eq(2).html('Tue');
                    $(this).children('option').eq(3).html('Wed');
                    $(this).children('option').eq(4).html('Thu');
                    $(this).children('option').eq(5).html('Fri');
                    $(this).children('option').eq(6).html('Sat');
                });
                $('label[for$="Recurrence_ddlDayNumber2"], label[for$="Recurrence_ddlDayOfWeek2"]').each(function () {
                    if ($(this).html().indexOf('of every month') >= 0) {
                        $(this).html('monthly');
                    } else if ($(this).html().indexOf('of every three months') >= 0) {
                        $(this).html('every 3rd mo.');
                    }
                });
                // shorter text for corporate and anonymous donations
                $('input[id$="chkCorporate"] + label').html('Give on behalf of a company');
                $('input[id$="chkAnonymous"] + label').html('Give anonymously');
                // give giving amount span a class and make it clickable to set giving amount
                if ($('input[name$="givingLevels"]').length !== 0) {
                    $('input[name$="givingLevels"]').each(function () {
                        $(this).closest('td').addClass('givingAmountInputTD').next('td').children('span').eq(0).addClass('givingAmount radioLabel').click(function () {
                            // remove "checked" class from other amount text input table row wrapper
                            $(this).parent().parent().siblings('tr[id$="trOther"]').children('td').removeClass('checked');
                            // fire click event of the hidden input when the label is clicked
                            $(this).parent().prev('td').find('label').eq(0).click();
                            if ($('input[id$="txtAmount"]').length !== 0) {
                                $('input[id$="txtAmount"]').val('');
                            }
                        });
                    });
                    // give the "Other Amount" label the same classes so that it's styled the same way on mobile devices
                    $('input[name$="givingLevels"][id$="rdoOther"]').next('label').addClass('givingAmount radioLabel');
                }
                // add class to table row wrapper around the "Other Amount" box when the "Other" input's label is clicked
                if ($('input[id$="txtAmount"]').length !== 0) {
                    $('input[id$="rdoOther"]').click(function () {
                        $(this).parent().parent().next('td').addClass('checked');
                    });
                }
                // nice treatment for checkboxes and radio buttons on mobile devices
                BBI.Methods.responsiveCheckboxesAddClass();
                BBI.Methods.responsiveCheckboxesChangeEvent();
                BBI.Methods.responsiveGivingAmountsAddClass();
                BBI.Methods.responsiveGivingAmountsChangeEvent();
                BBI.Methods.responsiveRadioButtonAddClass();
                BBI.Methods.responsiveRadioButtonChangeEvent();
                // add "clearfix" class to span that contains company matching gift link
                if ($('input[id$="chkMGCompany"]').length !== 0) {
                    $('input[id$="chkMGCompany"]').parent().addClass('clearfix');
                }
                // remove whitespace nodes in recurrence area
                BBI.Methods.cleanWhiteSpace('div[id$="Recurrence_divFrequency"] td');
            }
        },
        
        // Event Registration Form (Classic) classes and responsive behavior
        responsiveEventRegistrationClassic: function () {
            if ($('.EventTable .EventProgressCell').length !== 0) {
                // treatment of the step navigation
                $('.EventTable table[id$="tblProgress"] th').each(function (index) {
                    var stepText = $(this).html();
                    var stepTextSplit = stepText.split('>');
                    $(this).html('<span class="stepIndex">' + (index + 1) + '</span><span class="stepText">' + stepTextSplit[1] + '</span>');
                });
                $('.EventTable table[id$="tblProgress"] th').last().addClass('last');
                // add class for attribute checklists
                $('div.LoginFormCheckListContainer').parent().prev('td').addClass('checklistLabelContainer');
                $('td.EventItemRegistrantControlCellName').parent().parent().parent().addClass('eventAttributeContainer');
                // add class for previous/next button container table
                $('.EventTable input[id*="StepNavigationTemplateContainerID"]').eq(0).closest('table').addClass('prevNextContainerTable');
                $('.EventTable input[id*="StartNavigationTemplateContainerID"]').eq(0).parent().addClass('nextContainerTR');
                // nice treatment for checkboxes on mobile devices
                BBI.Methods.responsiveCheckboxesAddClass();
                BBI.Methods.responsiveCheckboxesChangeEvent();
            }
        },
        
        // Event Registration Form (3.0) behavior
        responsiveEventRegistrationNew: function () {
            // remove sky bundle
            if ($('.Ev3_EventWizard').length !== 0) {
                $('head').find('link[href*="sky-bundle.css"]').remove();
                $('head').find('link[href*="skyless.css"]').remove();
            }
            // accessible labels
            function selectLabels(fieldtype) {
                $('.BBDivFieldContainer > div > span').not('.DonationCaptureRequiredFieldMarker').each(function () {
                    var spanLabelText = $(this).text();
                    var spanElementID = $(this).parent().closest(fieldtype).attr('id');
                    var newLabelHTML = '<label for="' + spanElementID + '">' + spanLabelText + '</label>';
                    $(newLabelHTML).insertAfter(this);
                    $(this).remove();
                });
            }
            if ($('.BBDivFieldContainer > select').length !== 0 || $('.BBDivFieldContainer > input').length !== 0) {
                selectLabels('select');
            }
        },
        
        // Payment Part responsive behavior
        responsivePaymentPart: function () {
            if ($('.PaymentPart_FormContainer').length !== 0) {
                // nice treatment for checkboxes on mobile devices
                BBI.Methods.responsiveCheckboxesAddClass();
                BBI.Methods.responsiveCheckboxesChangeEvent();
            }
        },
        
        // Survey Part classes and responsive behavior
        responsiveSurvey: function () {
            if ($('.SurveyQuestionTable').length !== 0) {
                $('.SurveyQuestionTable td span.BBFormRequiredFieldMarker').parent().next('td').children('span').eq(0).addClass('required');
            }
        },
        
        // User Email Preferences classes and responsive behavior
        responsiveUserEmailPreferences: function () {
            if ($('.SubscriptionFormTable').length !== 0) {
                // nice treatment for checkboxes on mobile devices
                BBI.Methods.responsiveCheckboxesAddClass();
                BBI.Methods.responsiveCheckboxesChangeEvent();
            }
        },
        
        // User Login Part classes and responsive behavior
        responsiveUserLogin: function () {
            if ($('.LoginFormTable').length !== 0) {
                // add classes to style table cells with no classes
                $('.LoginFormTable .BBFieldControlCell').each(function () {
                    $(this).prev('td').addClass('BBFieldCaption');
                });
                // add class - "rememberLoginContainer"
                $('label[for$="cbRememberLogin"]').parent().addClass('rememberLoginContainer');
                // add class to table that holds validation container
                $('.LoginFormValidatorSummary').closest('table').addClass('userLoginValidationContainer');
            }
            if ($('tr[id$="trSignInBody"]').length !== 0) {
                // add class to outer part container
                $('tr[id$="trSignInBody"]').closest('table').addClass('userLoginPart');
                // nice treatment for checkboxes on mobile devices
                BBI.Methods.responsiveCheckboxesAddClass();
                BBI.Methods.responsiveCheckboxesChangeEvent();
            }
        },
        
        // force Event Calendar to show in list view on mobile devices
        responsiveEventCalendar: function () {
            if (($('.EventCalendarPartContainer').length !== 0) && ($('.CalendarViewCalendarContainer').length !== 0)) {
                $('input[id$="ImageButtonViewList"]').click();
            } else if ($('.EventCalendarPartContainer').length !== 0) {
                $('a.ListViewEventTitle').each(function () {
                    if ($(this).parent().find('.BBFormSubmitButton').length === 0) {
                        var href = $(this).attr('href');
                        $(this).parent().append('<a class="BBFormSubmitButton" href="' + href + '">View Details</a>');
                    }
                });
            }
        },
        
        cleanEventCalendar: function () {
            // remove whitespace nodes in event info container
            BBI.Methods.cleanWhiteSpace('.CalendarFormEventInfoContainer tr:nth-child(2) td:nth-child(2)');
        },
        
        // remove date range options in Event Calendar list view
        hideDateRanges: function () {
            if (($('.EventCalendarPartContainer').length !== 0) && ($('.ListViewContainer').length !== 0)) {
                $('select[id$="ddlDateRange"]').find('option:nth-child(2), option:nth-child(3)').hide();
            }
        },
        
        // Mini Donation Form style reset
        miniDonationForm: function () {
            if ($('.bbminiform-container').length !== 0) {
                $('#PageHead link[href*="skyless"]').remove();
                $('#PageHead link[href*="DonationCheckoutDisplay"]').remove();
                $('#PageHead style[data-href*="skyless"]').remove();
                $('#PageHead style[data-href*="DonationCheckoutDisplay"]').remove();
            }
        },
        
        // Acquisition Form style reset
        acquisitionForm: function () {
            if ($('.skyContainer').length !== 0) {
                $('#PageHead link[href*="skyless"]').remove();
                $('#PageHead link[href*="EmailSignInDisplay"]').remove();
                $('#PageHead style[data-href*="skyless"]').remove();
                $('#PageHead style[data-href*="EmailSignInDisplay"]').remove();
            }
        }
    }
};

// run global scripts
BBI.Methods.pageInit();


/* PLUGINS
==================================================================== */

// make it safe to use console.log always
(function(a){function b(){}for(var c='assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn'.split(','),d;!!(d=c.pop());){a[d]=a[d]||b;}})
(function(){try{console.log();return window.console;}catch(a){return (window.console={});}}());// JavaScript Document// JavaScript Document