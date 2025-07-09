const scriptUrl = "https://script.google.com/macros/s/AKfycbwoOKwTlrnQVxRdplScqo6qt4kx4HUG8SF3sqLF0BvMfE23lzaFCoMezFYg0G0xnyXX/exec"

$(document).ready(function() {
  let selectedDeviceId
  const codeReader = new ZXing.BrowserMultiFormatReader()
  codeReader.listVideoInputDevices()
    .then((videoInputDevices) => {
      const sourceSelect = $('#sourceSelect')

      if (window.innerWidth <= 768 && videoInputDevices.length >= 2) {
        selectedDeviceId = videoInputDevices[1].deviceId
        const buttonvideo = $('#buttonvideo')
        buttonvideo.css('display', 'block')
      } else {
        selectedDeviceId = videoInputDevices[0].deviceId
      }

      if (videoInputDevices.length >= 1) {
        $.each(videoInputDevices, function(index, element) {
          const sourceOption = $('<option>', {
            text: element.label,
            value: element.deviceId
          })
          sourceSelect.append(sourceOption)
        })

        sourceSelect.on('change', function() {
          selectedDeviceId = sourceSelect.val()
        })

        $('#sourceSelectPanel').css('display', 'block')
      }

      $('#startButton').on('click', function() {
        const vdoss = $('#vdoss')
        vdoss.css('display', 'block')
        codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', function(result, err) {
          if (result) {
            $('#result').val(result.text)
            codeReader.reset()
            const vdoss = $('#vdoss')
            vdoss.css('display', 'none')
          }
          if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error(err)
            $('#result').text(err)
          }
        })
      })
      $('#resetButton,#resetButton2').on('click', function() {
        const vdoss = $('#vdoss')
        vdoss.css('display', 'none')
        const statustable = $('#tabledata')
        statustable.css('display', 'none')
        codeReader.reset()
        $('#result').val("")
        $('#IDresult').val("")
      })
    })
    .catch(function(err) {
      console.error(err)
    })
})

$(document).ready(function() {
  let data3 = []
  $.getJSON(scriptUrl, function(data) {
    data3 = data.data1
    $("#result").autocomplete({
      source: function(request, response) {
        let term = request.term.toUpperCase()
        let filteredCodes = data3.filter(function(item) {
          return item[1].toUpperCase().startsWith(term)
        })
        let uniqueCodes = []
        let seen = {}
        filteredCodes.forEach(function(item) {
          if (!seen[item[1]]) {
            uniqueCodes.push(item)
            seen[item[1]] = true
          }
        })
        response($.map(uniqueCodes, function(item) {
          return { label: item[1], value: item[1], data: item }
        }))
      },
      minLength: 1,
      select: function(event, ui) {
        let selectedData = ui.item.data
        let mmCode = selectedData[1]
      },
    })

    $("#IDresult").autocomplete({
      source: function(request, response) {
        let term = request.term.toUpperCase()
        let filteredCodes = data3.filter(function(item) {
          return item[2].toUpperCase().startsWith(term)
        })
        let uniqueCodes = []
        let seen = {}
        filteredCodes.forEach(function(item) {
          if (!seen[item[2]]) {
            uniqueCodes.push(item)
            seen[item[2]] = true
          }
        })
        response($.map(uniqueCodes, function(item) {
          return { label: item[2], value: item[2], data: item }
        }))
      },
      minLength: 1,
      select: function(event, ui) {
        let selectedData = ui.item.data
        let mmCode = selectedData[2]
      },
    })

    $("#result, #IDresult").on("change", function() {
      let selectedCode = $("#result").val()
      let selectedDate = $("#IDresult").val()
      let matchingCode = data3.find(function(item) {
        return item[1] === selectedCode;
      })

      let matchingDate = data3.find(function(item) {
        return item[2] === selectedDate;
      })
      if (matchingCode) {
        $("#IDresult").val(matchingCode[2]);
      }
      if (matchingDate) {
        $("#result").val(matchingDate[1]);
      }
      updateTable(selectedCode, selectedDate, data3)
    })

    $("#search, #search2").on("click", function() {
      loadData()
      let selectedCode = $("#result").val()
      let selectedDate = $("#IDresult").val()
      updateTable(selectedCode, selectedDate, data3)
    })

    $("#rejectButton").on("click", function() {
      console.log("Rejected.")
      loadData()
      $("#myModal").modal("hide")
    })

    $("#savebutton").on("click", function() {
      submit()
      loadData()

    })

    function submit() {
      loadData()
      let selectedCode = $("#result").val()
      let selectedDate = $("#IDresult").val()
      updateTable(selectedCode, selectedDate)
      $.LoadingOverlay('show');
      const fileInput = $('#file')[0];
      const file = fileInput.files[0];
      const fr = new FileReader();
      fr.onload = function(e) {

        let base64File = null;

        if (file) {
          base64File = e.target.result.replace(/^.*,/, '');
        }

        let data = {
          opt: 'savedata',
          info1: $("#data0").val(),
          info2: $("#data7").val(),
          info3: $("#data8").val(),
          info4: $("#data9").val(),
          info5: $("#data10").val(),
          file: base64File
        }
        $.ajax({
          method: "POST",
          url: scriptUrl,
          data: data,
          dataType: 'json',
          success: function(res) {
            $.LoadingOverlay('hide');
            if (res.status == 'success') {
              return Swal.fire({
                icon: 'success',
                title: 'บันทึกข้อมูลเสร็จสิ้น',
                showConfirmButton: false,
                timer: 1500
              }).then(() => {
                $("#myModal").modal("hide")
                loadData()
                let selectedCode = $("#result").val()
                let selectedDate = $("#IDresult").val()
                updateTable(selectedCode, selectedDate)
              })
            }
          },
          error: function(err) {
            console.log(err);
            $.LoadingOverlay('hide');
            return Swal.fire({
              icon: 'error',
              title: 'บันทึกไม่สำเร็จ ติดต่อผู้เขียนระบบ',
              showConfirmButton: false,
              timer: 2000
            });
          },
        });
      };
      if (file) {
        fr.readAsDataURL(file);
      } else {
        fr.onload();
      }
    }

    function loadData() {
      $.getJSON(scriptUrl, function(data) {
        data3 = data.data1;
      });
    }



    function updateTable(selectedCode, selectedDate) {
      loadData();
      let matchingRows = data3.filter(function(item) {
        return (
          (selectedCode && item[1] === selectedCode) ||
          (selectedDate && item[2] === selectedDate)
        );
      });

      let tableBody = $("#table-body");
      tableBody.empty();

      let count = 0;
      let sum = 0;

      matchingRows.forEach(function(row) {
        const tabledata = $('#tabledata');
        tabledata.css('display', 'block');
        let rowHtml =
          "<tr>" +
          "<td>" + row[2] + "</td>" +
          "<td>" + row[3] + "</td>" +
          "<td>" + row[8] + "</td>" +
          "<td>" + row[6] + "</td>" +
          "<td><button class='btn btn-primary check-button' data-toggle='modal' data-target='#myModal' data-code='" + row[0] + "'>ตรวจสอบ</button></td>" +
          "</tr>";
        tableBody.append(rowHtml);
        count++;
        if (row[9] === "รอชำระ") {
          sum += parseFloat(row[6]);
        }
      });
      $("#Numberofitems").val(count);
      $("#TotalSumOfRow6").val(sum);

      $(".check-button").on("click", function() {
        let code = $(this).data("code");
        let modalTitle = "UID ที่ตรวจสอบ " + code;

        let row = data3.find(function(item) {
          return item[0] === code;
        });

        if (row) {
          let data0 = row[0];
          let data1 = row[1];
          let data2 = row[2];
          let data3 = row[3];
          let data4 = row[4];
          let data5 = row[5];
          let data6 = row[6];
          let data7 = row[7];
          let data8 = row[8];
          let data9 = row[9];
          let data10 = row[10];
          let data11 = row[11];

          let initialValue = data9;

          let selectElement = $('select[aria-label="Default select"]');

          selectElement.val(initialValue);

          $("#exampleModalLabel").text(modalTitle);
          $("#data0").val(data0);
          $("#data1").val(data3);
          $("#data2").val(data4);
          $("#data3").val(data5);
          $("#data4").val(data6);
          $("#data5").val(data7);
          $("#data6").val(data8);
          $("#data8").val(data10);
          $("#data9").val(data11);

          $("#myModal").modal("show");
        } else {
          console.log("Row not found.");
        }
      });
    }
  })
})
