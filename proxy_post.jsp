<%@ page import="java.io.*, java.net.*"%>
<%
    String address = "http://147.27.14.7:8080/sokratis/process.jsp";
	StringBuffer reply = new StringBuffer();

    //Access the page
    try {    
   		//Encode the parameters. Spaces will be replaced by '+'
    	String encodedParameters = URLEncoder.encode(request.getParameter("sentence"),"UTF-8");
        System.err.println(request.getParameter("sentence"));
        //Send the POST request
   		URL url = new URL(address);
        URLConnection conn = url.openConnection();
        conn.setDoOutput(true);
        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
        
        //Write parameters
        writer.write(encodedParameters);
        writer.flush();
        
        //Get the response
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(),"UTF8"));
        String inputLine;
        while ( (inputLine = reader.readLine()) != null) {
        	reply.append(inputLine);
			System.err.println("Response: " + inputLine);
		}
        writer.close();
        reader.close();
    } 
    catch (MalformedURLException e) {
    	out.println(e.getMessage());
    } catch (IOException e) {
    	out.println(e.getMessage());
    }
%><%= reply.toString() %>

